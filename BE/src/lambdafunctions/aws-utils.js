/**
 * This file contains all AWS utilities that will be used by vdh-fetcher.js
 */
let AWS = require('aws-sdk');
const { S3 } = require('aws-sdk');
let s3 = new AWS.S3({region: 'us-east-1', apiVersion: 'latest', signatureVersion: 'v4'})

let credentials = new AWS.SharedIniFileCredentials();
AWS.config.credentials = credentials;
AWS.config.update({region: 'us-east-1'});



AWS.config.getCredentials(err => {
    if(err) console.log(err);
    else {
        console.log("Print from aws-utils.js")
        console.log("Access key: ", AWS.config.credentials.accessKeyId);
        console.log("Secret key: ", AWS.config.credentials.secretAccessKey);
        console.log("Region: ", AWS.config.region);
    }
});
/**
 * Given a bucket name, search if that bucket exist on AWS S3 server
 * @param {string} bucketName the bucket name to search for on S3
 * @return {Promise} a promise containing boolean true if bucket found, false otherwise
 * @throws {error} throw any error if encountered during AWS process
 */
let AWSSearchBucket = async bucketName => {
    let result = await s3.listBuckets({}).promise();
    if ((result.Buckets.filter(bucketDetails => bucketDetails.Name === bucketName)).length === 0){
        return false;
    }
    return true;
}

/**
 * Given a bucket name, create that bucket on S3 with ACL private
 * @param {string} bucketName the bucket name to create with
 * @param {JSON} config the AWS configuration for this bucket creation, default to {ACL: private}
 * @return {Promise} a promise with the bucket name after resolved, else throws error
 * @throws {error} throw any error if encountered during AWS process
 */
let AWSCreateBucket = async (bucketName, config={ACL: 'private'}) => {
    config.Bucket = bucketName;
    try{
        await s3.createBucket(config).promise();
        return bucketName;
    }
    catch(err){
        console.log(err);
        throw err;
    }
}

/**
 * Given a bucket name and an item name, return the item's content (regardless if there's anything or not)
 * @param {string} bucketName the bucket name to search for the item in
 * @param {string} itemName the full labelled name of the item, in other word, the item key
 * @return {Promise} a promise which resolves to content of the item, null otherwise
 * @throws {error} any error encountered during AWS operation
 */
let AWSGetBucketObject = async (bucketName, itemName) => {
    try{
        let res = await s3.getObject({Bucket: bucketName, Key: itemName}).promise();
        return res.Body;
    }
    catch(err){
        if(err.code === "NoSuchKey"){
            return null;
        }
        throw err;
    }
}

/**
 * Creates the item in the given bucket with a given item name.
 * @param {string} bucketName the bucket name to put the item in
 * @param {string} itemName the item name or the key, if just empty folder, make sure pass in "/" for final character
 * @param {buffer} body the buffer of the content of the item
 * @return {Promise} a promise when resolved contains true if the creation was successfull, else throws error
 * @throws {error} any error during S3 operation
 */
let AWSCreateBucketObject = async (bucketName, itemName, body=null) => {
    let config = {
        Bucket: bucketName,
        Key: itemName
    }
    if(body) config.Body = body
    return await s3.putObject(config).promise();
}


/**
 * Given a bucket name, retrieve the folders inside that bucket ONLY. This means no nested item
 * @param {String} bucketName the bucket name to retrieve item from
 * @param {String} prefix the prefix of the folder to search for
 * @param {List} keyList the list of folders retrieved from the entire listing operation. This can spand multiple queries hence in beginning
 * when calling this, it will be [], however, subsequent queries will carries data
 */
let AWSListFolders = async (bucketName, keyList=[], prefix, token=null) => {
    let config = {
        Bucket: bucketName,
        Prefix: prefix
    }
    if(token) config.ContinuationToken=token;
    let data = await s3.listObjectsV2(config).promise();
    keyList = keyList.concat(data.Contents.map(e => {return e.Key}).filter(e => e.endsWith("/")));
    if(data.IsTruncated) await AWSListFolders(bucketName, keyList, prefix, data.NextContinuationToken);
    else return keyList;
}


module.exports = {
    AWSCreateBucket, 
    AWSGetBucketObject,
    AWSSearchBucket,
    AWSCreateBucketObject,
    AWSListFolders
}