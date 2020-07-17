
let csv = require('csv');
let AWS = require('aws-sdk');
let fipsMap = require('./fips.json');
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
 * Split the CSV into sections and insert into S3 for the needed section.
 * First retrieve latest folder date on S3 and insert data from that date up until current date
 * @param {String} currentDay the current day in format mm/dd/yyyy (no zero padding)
 * @param {String} csvFile the csv file path with its name attached
 */
let storeCSVS3 = (currentDay, csvFile) => {
    

}


module.exports = {
    createStorageFolders
}
