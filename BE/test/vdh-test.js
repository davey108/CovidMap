let vdhFetcher = require('../src/lambdafunctions/vdh-fetcher');
let assert = require('assert');
let AWS = require('aws-sdk');
let csv = require('csv');

let credentials = new AWS.SharedIniFileCredentials({profile: 'personal-account'});
AWS.config.credentials = credentials;
let s3 = new AWS.S3({region: 'us-east-1', apiVersion: 'latest', signatureVersion: 'v4'})

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
        vdhFetcher.parseCSVDaily("C:/Users/DavidPC/Documents/covidmap/CovidMap/BE/test/VDH-COVID-19-PublicUseDataset-Cases.csv");
    }
    catch(err) {
        console.log(err);
    }
}

module.exports = {
    triggerAllTests
}




