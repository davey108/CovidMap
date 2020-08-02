let fs = require('fs');
let csv = require('csv');
let awsUtils = require('./aws-utils');
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
 * Create the storage folder locally for the day if it is missing.
 * @param {str} missingDate the date in format of mm-dd-yyyy
 */
let createStorageFoldersLocal = missingDate => {
    const vdhPublicDataSetFolder = "Public-Dataset-Cases"
    try{
        fs.mkdirSync(vdhPublicDataSetFolder + "/" + missingDate, {recursive: true});
    }
    catch(err) {
        console.log("Encountered exception below when creating file: ", vdhPublicDataSetFolder + "/" + missingDate);
        console.log(err);
        throw err;
    }
}

/**
 * Creates a CSV file string content for the given date data of each locality with its statistic
 * @param {2D array} csvData 2D array CSV data which each item is an array that contains the FIPS, Locality, VDH Health Locality, Total Case, Hospital, Deaths respectively
 * @return {string} the CSV file contents in string format to be return to the caller to write to the file
 */
let createCSVDataStringForDate = csvData => {
    let data = csvData.map(item => item.join(",")).join("\n");
    return data;
}

/**
 * Accepts a CSV file and tries to parse it with the needed daily data, or if data are missing, tries to create missing
 * data received from the CSV file
 * @param {string} csvFileName the csv file name to parse daily
 * @return {boolean} true if the CSV is parsed successfully, false otherwise
 */
let parseCSVDaily = csvFileName => {
    try{
        let dirDates = fs.readdirSync("Public-Dataset-Cases").map(e => e.replace(new RegExp("-", "g"), "/"));
        // CSV file will only come from latest date first then older date
        let contents = fs.readFileSync(csvFileName, {encoding: "utf-8"}).split("\r\n").slice(1).map(e => e.split(","));
        // first will always be in date format: mm/dd/yyyy
        // we have the CSV file of each date available, parse the CSV by newest date first, see if it's data
        // is there, if not, then store the data for that date into a new folder, if it's there, stop processing
        // any further data, because we assume we have the date
        let currDate = contents[0][0]
        CSVDatetoLocality = []
        for(let dateData of contents) {
            if(currDate === dateData[0]) CSVDatetoLocality.push(dateData.slice(1));
            // got into a new date, we must then see the file
            else {
                if(!dirDates.includes(currDate)){
                    currDateDashFormat = currDate.replace(new RegExp("/", "g"), "-");
                    createStorageFoldersLocal(currDateDashFormat);
                    fs.writeFileSync("Public-Dataset-Cases" + "/" + currDateDashFormat + "/" + "data.csv",createCSVDataStringForDate(CSVDatetoLocality), {encoding: 'utf-8'});
                }
                else{
                    console.log("The system has the most up to date data");
                    return true;
                }
                currDate = dateData[0];
                CSVDatetoLocality = [dateData.slice(1)];
            }
        }
        return true;
    }
    catch(err){
        console.log(err);
        return false;
    }
}

/**
 * Split the CSV into sections and insert into S3 for the needed section.
 * First retrieve latest folder date on S3 and insert data from that date up until current date
 * @param {String} csvFile the csv file path with its name attached
 * @return {Promise} a promise that indicate whether the operation was successful or not
 */
let storeCSVS3 = async csvFile => {
    const bucketName = "vdh-dataset";
    const vdhPublicDataSetFolder = "Public-Dataset-Cases";
    try{
        let items = await awsUtils.AWSListFolders(bucketName, [], vdhPublicDataSetFolder + "/");
        // CSV file will only come from latest date first then older date
        let contents = fs.readFileSync(csvFileName, {encoding: "utf-8"}).split("\r\n").slice(1).map(e => e.split(","));
        let currDate = contents[0][0]
        CSVDatetoLocality = []
        for(let dateData of contents) {
            if(currDate === dateData[0]) CSVDatetoLocality.push(dateData.slice(1));
            // got into a new date, we must then see the file
            else {
                if(!dirDates.includes(currDate)){
                    currDateDashFormat = currDate.replace(new RegExp("/", "g"), "-");
                    await createVDHFolderDate(currDateDashFormat);
                    //fs.writeFileSync("Public-Dataset-Cases" + "/" + currDateDashFormat + "/" + "data.csv",createCSVDataStringForDate(CSVDatetoLocality), {encoding: 'utf-8'});
                    let buffer = Buffer.from(createCSVDataStringForDate(CSVDatetoLocality));
                    await awsUtils.AWSCreateBucketObject(bucketName, vdhPublicDataSetFolder + "/" + currDateDashFormat + "/", buffer);
                }
                else{
                    console.log("The system has the most up to date data");
                    return true;
                }
                currDate = dateData[0];
                CSVDatetoLocality = [dateData.slice(1)];
            }
        }
        return true;
    }
    catch(err){
        console.log(err);
        return false;
    }
}


module.exports = {
    storeCSVS3,
    createStorageFoldersLocal,
    parseCSVDaily
}
