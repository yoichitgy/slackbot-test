module.exports = async (body) => {
    // Avoid responding to messages from the bot itself and edited messages.
    if (body.event.bot_id || body.event.subtype == 'message_changed') {
        console.log('Ignore this event type. Message from the bot itself or edited message.');
        return {
            statusCode: 200
        };
    }

    const {mention, command, args} = parseText(body.event.text);
    console.log(`mention: ${mention}, command: ${command}, args: ${args}`);

    let message = '';
    switch (command) {
        case 'echo':
            message = echo(args);
            break;
        case 'lottery':
            message = lottery(args);
            break;
        case 'help':
            message = help();
            break;
        case undefined:
            message = 'Command is empty. Run `@slackbot-text help`.';
            break;
        default:
            message = 'Unknown command. Run `@slackbot-text help`.';
    }

    await postMessage(message, body.event.channel);
}

function parseText(text) {
    let [mention, ...remainings] = text.split(' ');

    // Remove spaces between mention and command.
    let spaceCount = 0;
    for (let i = 0; i < remainings.length; i++) {
        if (remainings[i] !== '') {
            break;
        }
        spaceCount++;
    }
    if (spaceCount > 0) {
        remainings.splice(0, spaceCount);
    }

    const [command, ...args] = remainings;   
    return {
        mention: mention,
        command: command,
        args: args
    }
}

function echo(args) {
    if (args.length == 0) {
        return 'Nothing to echo...';
    }
    return args.join(' ');
}

function lottery(args) {
    const candidates = args.filter(a => a !== '');
    if (candidates.length == 0) {
        return 'We have no one joined the lottery.';
    }

    const winnerIndex = Math.floor(Math.random() * candidates.length);
    const winner = candidates[winnerIndex];
    return `
        Candidates: ${candidates}

        ${winner} won the lottery!!!
    `
}

function help() {
    const message = `Usage: \`@slackbot-test COMMAND [ARGS...]\`

    Commands:
      echo\tEcho the remained text. E.g. @slackbot-test echo hello world!
      help\tPrint this message. E.g. @slackbot-test help
      lottery\tPick one from space-separated items. E.g. @slackbot-test lottery alice bob chris
    `;
    return message;
}

async function postMessage(text, channel) {
    const url = 'https://slack.com/api/chat.postMessage';
    const headers = {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + process.env['SLACK_BOT_USER_OAUTH_TOKEN']
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
