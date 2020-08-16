let fs = require('fs');
let csv = require('csv');
let awsUtils = require('./aws-utils');
let soda = require('soda-js');
let fipsMap = require('./fips.json');
const { exit } = require('process');
// think of a way to cache state to prevent too many GET call

/**
 * Creates the storage folder for a specific given date for VDH data
 * @param {str} folderDate the date in format of mm-dd-yyyy
 * @return {Promise} true if the file was created, false if any error was encountered and console out the error
 */
let createVDHFolderDate = async folderDate => {
    const bucketName = "vdh-dataset";
    const vdhPublicDataSetFolder = "Public-Dataset-Cases";
    try{
        let res = await awsUtils.AWSSearchBucket(bucketName);
        if(!res) await awsUtils.AWSCreateBucket(bucketName);
        if(!(await awsUtils.AWSGetBucketObject(bucketName, vdhPublicDataSetFolder + "/")))
            await awsUtils.AWSCreateBucketObject(bucketName, vdhPublicDataSetFolder + "/");
        if(!(await awsUtils.AWSGetBucketObject(bucketName, vdhPublicDataSetFolder + "/" + folderDate + "/")))
            await awsUtils.AWSCreateBucketObject(bucketName, vdhPublicDataSetFolder + "/" + folderDate + "/");
        else console.log("Folder for this date: " + folderDate + " already exist");
        return true;
    }
    catch(err){
        console.log(err);
        return false;
    }
}

/**
 * A function to fetch the public user dataset
 * @param {JSON} options the options to filter the data by
 * @returns {Promise} a promise containing the data or error if any unexpected event happened
 */
let fetchPublicUseDataset = (options=null) => {
    let consumer = new soda.Consumer('data.virginia.gov');
    return new Promise((resolve, reject) => {
        let queryEvt = consumer.query().withDataset('bre9-aqqr').order('fips');
        if(options){
            queryEvt = queryEvt.where(options) 
        }
        queryEvt.getRows()
        .on('success', rows => {
            resolve(rows);
        })
        .on('error', error => {
            reject(error);
        });
    });
}

/**
 * Fetch daily dataset from VDH site and store into DynamoDB filling all attributes
 * @return {Promise} a promise resolve to success message or else reject to any error that might happen
 */
let fetchDailyDatasetDynamo = async () => {

}

/**
 * Fetch all dataset from VDH site and store into DynamoDB filling all attributes for cold start
 * @return {Promise} a promise resolve to successful operation or else reject to any error
 */
let fetchDailyDataColdStartDynamo = async () => {
    
}

/**
 * Fetch daily dataset from VDH site and store into S3
 * @returns {Promise} a promise resolve to data in JSON format else resolve to any error that might happen
 */
let fetchDailyDataset = async () => {
    const bucketName = "vdh-dataset";
    const vdhPublicDataSetFolder = "Public-Dataset-Cases";
    let today = new Date();
    let todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // normalize the midnight time to be 00H 00M 00SS so toISOString() is UTC-0. We don't know what's the TZ we are calling this from
    todayMidnight.setHours(todayMidnight.getHours() - (todayMidnight.getTimezoneOffset()/60));
    let data = await fetchPublicUseDataset({report_date: todayMidnight.toISOString().slice(0,-1)});
    // if the data returned is empty, then we know that date has no data, either we are in the future by 1 day, or we 
    // are in the past, if the counter is more than 3, we know we went way too into the past
    if(data && data.length === 0){
        // query 1 date back
        todayMidnight.setDate(todayMidnight.getDate() - 1);
        // can never be more than 2 dates
        data = await fetchPublicUseDataset({report_date: todayMidnight.toISOString().slice(0,-1)})
        // if this is empty again, then something is wrong and cold start might need to be run
        if(data && data.length === 0){
            console.log("Two consecutive dates received empty data, please check and run cold start method");
            return "Empty records when trying to retrieve data for 2 consecutive dates. Please check logs";
        }
    }
    // store into S3
    // store this data 
    let currDateDashFormat = (todayMidnight.getUTCMonth() + 1) + "-" + todayMidnight.getUTCDate() + "-" + todayMidnight.getUTCFullYear()
    console.log("Storing data for date: " + currDateDashFormat);
    if (await createVDHFolderDate(currDateDashFormat)){
        let buffer = Buffer.from(JSON.stringify(data));
        await awsUtils.AWSCreateBucketObject(bucketName, vdhPublicDataSetFolder + "/" + currDateDashFormat + "/" + "data.json", buffer);
    }
    else{
        console.log("Some error happend while trying to create folder, please review logs");
        return "Error occurred during the vdh data retrieval process"
    }
};


/**
 * Fetch the JSON data cold start, logic same as fetchDailyData but we account for empty data and keep going back
 */
let fetchDailyDataColdStart = async () => {
    const bucketName = "vdh-dataset";
    const vdhPublicDataSetFolder = "Public-Dataset-Cases";
    // use to keep track so we don't keep going back into the past beyond first date
    let emptyCount = 0
    let today = new Date();
    let todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // normalize the midnight time to be 00H 00M 00SS so toISOString() is UTC-0. We don't know what's the TZ we are calling this from
    todayMidnight.setHours(todayMidnight.getHours() - (todayMidnight.getTimezoneOffset()/60));
    do {
        console.log("Getting data for date: " + todayMidnight.toISOString().slice(0,-1));
        let data = await fetchPublicUseDataset({report_date: todayMidnight.toISOString().slice(0,-1)});
        /*console.log(todayMidnight.getUTCDate());
        console.log(todayMidnight.toISOString().slice(0,-1));
        console.log(data);
        process.exit(1);*/
        if(data && data.length === 0){
            emptyCount ++;
        }
        else {
            // store this data
            let currDateDashFormat = (todayMidnight.getUTCMonth() + 1) + "-" + todayMidnight.getUTCDate() + "-" + todayMidnight.getUTCFullYear()
            console.log("Storing data for date: " + currDateDashFormat);
            if (await createVDHFolderDate(currDateDashFormat)){
                let buffer = Buffer.from(JSON.stringify(data));
                await awsUtils.AWSCreateBucketObject(bucketName, vdhPublicDataSetFolder + "/" + currDateDashFormat + "/" + "data.json", buffer);
                console.log("Created JSON data for date: " + currDateDashFormat);
            }
            else{
                console.log("Some error happend while trying to create folder, please review logs");
                return "Error occurred during the vdh data retrieval process"
            }
        }
        // different because we go back in date anyway
        todayMidnight.setDate(todayMidnight.getDate() - 1);
    } while(emptyCount <= 2)
}


module.exports = {
    fetchDailyDataset,
    fetchDailyDataColdStart
}
