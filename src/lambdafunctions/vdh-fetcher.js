import AWS from 'aws-sdk';

let credentials = new AWS.SharedIniFileCredentials({profile: 'personal-account'});
AWS.config.credentials = credentials;

export let getConfig = () => {
    AWS.config.getCredentials(err => {
        if(err) console.log(err);
        else {
            console.log("Access key: ", AWS.config.credentials.accessKeyId);
            console.log("Secret key: ", AWS.config.credentials.secretAccessKey);
        }
    });
}





