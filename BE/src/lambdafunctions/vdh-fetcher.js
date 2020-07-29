let fs = require('fs');
let csv = require('csv');
let AWS = require('aws-sdk');
let fipsMap = require('./fips.json');
const { exit } = require('process');
let s3 = new AWS.S3({region: 'us-east-1', apiVersion: 'latest', signatureVersion: 'v4'})

let credentials = new AWS.SharedIniFileCredentials({profile: 'personal-account'});
AWS.config.credentials = credentials;



AWS.config.getCredentials(err => {
    if(err) console.log(err);
    else {
        console.log("Access key: ", AWS.config.credentials.accessKeyId);
        console.log("Secret key: ", AWS.config.credentials.secretAccessKey);
    }
});

/**
 * This function creates the folder for storing the vdh public use dataset cases if not exist
 * @return a promise which contains a JSON with fields name and text, where name contains the folder's key and text describe created items
 */
let createStorageFolders = async () => {
    const bucketName = "vdh-dataset";
    const vdhPublicDataSetFolder = "Public-Dataset-Cases";
    let text = [];
    try{
        let data = await s3.listBuckets({}).promise();
        if ((data.Buckets.filter(bucketDetails => bucketDetails.Name === bucketName)).length === 0){
            // create bucket if doesn't exist
            let createBucketParams = {
                Bucket: bucketName,
                ACL: 'private'
            }
            await s3.createBucket(createBucketParams).promise();
            text.push("Bucket")
        }
        // check if the file is there
        // the / indicates it is a folder in S3 object
        await s3.getObject({Bucket: bucketName, Key: vdhPublicDataSetFolder + "/"}).promise();
        return {name: vdhPublicDataSetFolder + "/", text: text};
    }
    catch(err){
        // catches if getting folder does not exist, then creates the folder
        if(err.code === "NoSuchKey"){
            await s3.putObject({Bucket: bucketName, Key: vdhPublicDataSetFolder + "/", ACL: 'private'}).promise();
            text.push("Folder")
            return {name: vdhPublicDataSetFolder + "/", text: text};
        }
        throw err;
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
 * @param {String} currentDay the current day in format mm/dd/yyyy (no zero padding)
 * @param {String} csvFile the csv file path with its name attached
 */
let storeCSVS3 = (currentDay, csvFile) => {
    

}


module.exports = {
    createStorageFolders,
    createStorageFoldersLocal,
    parseCSVDaily
}
