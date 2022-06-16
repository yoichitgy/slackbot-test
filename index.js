const crypto = require('crypto');

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

    return await handleRequest(body);
};

async function handleRequest(body) {
    // Avoid responding to messages from the bot itself and edited messages.
    if (body.event.bot_id || body.event.subtype == 'message_changed') {
        console.log('Ignore this event type. Message from the bot itself or edited message.');
        return {
            statusCode: 200
        };
    }

    const text = body.event.text.split(' ')[1]; // Remove a mention part before the space.
    await postMessage('Echo: ' + text, body.event.channel);
    const response = {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('Recieved a message from Slackbot.'),
    };
    return response;
}

async function postMessage(text, channel) {
    const url = 'https://slack.com/api/chat.postMessage';
    const headers = {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + process.env['BOT_USER_OAUTH_TOKEN']
    };
    const data = {
        'channel': channel,
        'text': text
    }
    await sendHttpRequest(url, 'POST', headers, data);
}

async function sendHttpRequest(url, method, headers, body) {
    const https = require('https');
    const options = {
        method: method,
        headers: headers,
    }

    return new Promise((resolve, reject) => {
        let req = https.request(url, options, (res) => {
            res.setEncoding('utf8');
            let resBody = '';
            res.on('data', (chunk) => {
                resBody += chunk;
            });
            res.on('end', () => {
                const r = {
                    'statusCode': res.statusCode,
                    'headers': res.headers,
                    'body': JSON.stringify(resBody),
                }
                console.log('Response: ' + JSON.stringify(r));
                resolve(r);
            });
        }).on('error', (e) => {
            console.log("Error: " + e);
            reject(e);
        });

        req.write(JSON.stringify(body));
        req.end();
    });
}

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
