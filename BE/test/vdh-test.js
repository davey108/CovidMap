let vdhFetcher = require('../src/lambdafunctions/vdh-fetcher');
let assert = require('assert');
let AWS = require('aws-sdk');
let csv = require('csv');

let credentials = new AWS.SharedIniFileCredentials({profile: 'personal-account'});
AWS.config.credentials = credentials;
let s3 = new AWS.S3({region: 'us-east-1', apiVersion: 'latest', signatureVersion: 'v4'})

let testSetUp = async () => {
    try{
        await s3.deleteObject({Bucket: "vdh-dataset", Key: "Public-Dataset-Cases/"}).promise();
        await s3.deleteBucket({Bucket: "vdh-dataset"}).promise();
    }
    catch(err) {
        console.log("Encountered exception ", err)
    }
}

let testNoBucketNoFolder = async () => {
    try {
        let result = await vdhFetcher.createStorageFolders();
        assert(result.text.length === 2, "Returned result did not matched length. Expected length of 2 but got " + result.text.length);
    }
    catch (err) {
        assert(false, "Unexpected error " + err);
        return err;
    }
}

let testBucketNoFolder = async () => {
    // set up to delete before proceed
    try{
        let params = {
            Bucket: "vdh-dataset",
            Key: "Public-Dataset-Cases/"
        }
        await s3.deleteObject(params).promise();
    }
    catch(err){
        console.log("Unexpected exception ", err)
    }
    try {
        let result = await vdhFetcher.createStorageFolders();
        assert(result.text.length === 1 && result.text[0] === "Folder", "Expected only folder to be created but got " + result.text.toString());
    }
    catch(err) {
        assert(false, "Unexpected error " + err);
        return err;
    }
}

let testHaveBoth = async () => {
    try {
        let result = await vdhFetcher.createStorageFolders();
        assert(result.text.length === 0, "Expected length to be 0 but got " + result.text.length);
    }
    catch(err) {
        assert(false, "Unexpected error " + err);
        return err;
    }
}
/**
 * Expect the CSV to be stored in S3
 */
let testInsertCSVS3CurrentDate = async () => {
    let today = new Date();
    today = today.getMonth() + 1 + '/' + today.getDate() + '/' + today.getFullYear();
}

/**
 * Expect the CSV to not be stored
 */
let testInsertCSVS3PastDate = async () => {
    let yesterday = new Date();
    yesterday.setDate(new Date().getDate() - 1);
    yesterday = yesterday.getMonth() + 1 + '/' + yesterday.getDate() + '/' + yesterday.getFullYear();

}

/**
 * Run all tests methods defined in this file
 */
let triggerAllTests = async () => {
    try{
        /*await testSetUp();
        await testNoBucketNoFolder();
        await testHaveBoth();
        await testBucketNoFolder();*/
        //vdhFetcher.createStorageFoldersLocal("7-28-2020");
        //vdhFetcher.createStorageFoldersLocal("7-27-2020");
        vdhFetcher.parseCSVDaily("VDH-COVID-19-PublicUseDataset-Cases.csv");
    }
    catch(err) {
        console.log(err);
    }
}

module.exports = {
    triggerAllTests
}




