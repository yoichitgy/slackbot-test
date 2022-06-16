module.exports = async (body) => {
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