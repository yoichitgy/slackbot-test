const crypto = require('crypto');
const handler = require('./handler');
  
// Assumes an event with Lambda Function URLs
exports.handler = async (event) => {
    console.log('Received an event: ' + JSON.stringify(event));
    const rawBody = event.body;
    const body = JSON.parse(rawBody);
    console.log('Parsed body: ' + JSON.stringify(body));

    // Check challenge
    const challenge = body.challenge;
    if (challenge) {
        return createChallengeResponse(challenge);
    }

    // Check signature
    if (!verifyRequestSignature(event.headers, rawBody)) {
        return {
            statusCode: 401
        };
    }

    return await handler(body);
};

function createChallengeResponse(challenge) {
    const response = {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: challenge
    };
    return response;    
}

function verifyRequestSignature(headers, rawBody) {
    const secret = process.env['SIGNING_SECRET'];
    const timestamp = headers['x-slack-request-timestamp'];
    const signature = headers['x-slack-signature'];

    // Check timestamp is not too old.
    const current = Math.floor(Date.now() / 1000);
    if (Math.abs(current - parseInt(timestamp)) > 60 * 5) {
        console.error('Timestamp differs more than 5 mins. Current timestamp: ' + current);  
        return false;
    }

    // Verify signature
    const str = 'v0:' + timestamp + ':' + rawBody;
    const hash = 'v0=' + crypto.createHmac('sha256', secret).update(str).digest('hex');
    if (hash !== signature) {
        console.error('Signature mismatch. From header: ' + signature + ", From secret: " + hash);  
        return false;
    }

    return true;
}
