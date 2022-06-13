exports.handler = async (event) => {
    console.log(JSON.stringify(event));

    const challenge = event.challenge;
    if (challenge) {
        return createChallengeResponse(challenge);
    }

    if (!event.event.bot_id && event.event.subtype != 'message_changed') {
        await postMessage('Recieved message: ' + event.event.text, event.event.channel);
    }

    const response = {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('Recieved a message from Slackbot.'),
    };
    return response;
};

function createChallengeResponse(challenge) {
    const response = {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: challenge
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
                    incomingMessage: JSON.stringify(res),
                    body: JSON.stringify(resBody),
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