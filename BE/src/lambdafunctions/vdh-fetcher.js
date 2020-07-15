let AWS = require('aws-sdk');
let credentials = new AWS.SharedIniFileCredentials({profile: 'personal-account'});
AWS.config.credentials = credentials;
let s3 = new AWS.S3({region: 'us-east-1', apiVersion: 'latest', signatureVersion: 'v4'})



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



module.exports = {
    createStorageFolders
}
