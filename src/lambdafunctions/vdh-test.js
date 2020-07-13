let vdhFetcher = require('./vdh-fetcher');

let myTestFunc = () => {
    return vdhFetcher.createStorageFolders().then(result => console.log(result)).catch(err => console.log(err));
}

module.exports = {
    myTestFunc
}




