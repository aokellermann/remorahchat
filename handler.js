const serverless = require('serverless-http')
const express = require('express')
const whapi = require('api')('@whapi/v1.7.5#20a0zlpqylhix');
const app = express()

const chat_id = process.env.CHAT_ID
const msg_token = process.env.MSG_TOKEN
const is_offline = process.env.IS_OFFLINE

if (is_offline) {
    console.log("offline mode")
}

whapi.auth(msg_token);

const idioms = [
    {
        re: /bats in (\w+) belfry/i,
        replace: "noodles in $1 noggin"
    }
]


app.post('/webhooks', (req, res) => {
    const body = JSON.parse(req.body)

    console.log(body);
    const promises = body.messages.map(msg => {

        if (msg.source === 'api') {
            console.log("msg is from api")
            return Promise.resolve()
        }

        // not target group
        if (msg.chat_id !== chat_id) {
            console.log("wrong chat_id")
            return Promise.resolve()
        }

        let text
        for (const idiom of idioms) {
            if (msg.text.body.match(idiom.re)) {
                const replaced = msg.text.body.replace(idiom.re, idiom.replace)
                text = `uh oh! it appears you used a speciesist phrase! next time, try '${replaced}'`
                break
            }
        }

        if (!text) {
            console.log("no triggering idioms found")
            return Promise.resolve()
        }

        console.log("triggering idiom detected! admonishing: " + text)

        if (is_offline) {
            return Promise.resolve()
        } else {
            return whapi.sendMessageText({typing_time: 0, to: chat_id, body: text, quoted: msg.id})
        }
    })

    Promise.all(promises)
        .then(x => res.sendStatus(200))
        .catch(x => console.log(x))
})

module.exports.handler = serverless(app);
