const aws = require('aws-sdk');

module.exports = async (secretId, region) => {
    return new Promise((resolve, reject) => {
        const client = new aws.SecretsManager({region: region});
        client.getSecretValue({SecretId: secretId}, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(data.SecretString));
            }         
        })
    });
};
