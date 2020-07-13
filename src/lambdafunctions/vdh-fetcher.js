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

/*
This function creates the folder for storing the vdh public use dataset cases if not exist
@return a promise which contains the folder name for storing the dataset or reject if error
*/
let createStorageFolders = async () => {
    const bucketName = "VDH-Dataset";
    const vdhPublicDataSetFolder = "Public-Dataset-Cases"

    try{
        let data = await s3.listBuckets({}).promise();
        if ((data.Buckets.filter(bucketDetails => bucketDetails.Name === bucketName)).length === 0){
            // create bucket if doesn't exist
            let createBucketParams = {
                Bucket: bucketName,
                ACL: 'private'
            }
            await s3.createBucket(createBucketParams).promise();
            // check if the file is there
            // the / indicates it is a folder in S3 object
            let getFolderResult = await s3.getObject({Bucket: bucketName, Key: bucketName + "/"}).promise();
        }
    }
    catch(err){
        throw err;
    }


    
}



module.exports = {
    createStorageFolders
}
