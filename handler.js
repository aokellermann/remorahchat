// https://business.whatsapp.com/blog/how-to-use-webhooks-from-whatsapp-business-api

const serverless = require('serverless-http')
const express = require('express')
const whapi = require('api')('@whapi/v1.7.5#20a0zlpqylhix');
const app = express()

const chat_id = process.env.CHAT_ID
const msg_token = process.env.MSG_TOKEN

whapi.auth(msg_token);

app.post('/webhooks', (req, res) => {
    const body = JSON.parse(req.body)

    console.log(body);
    const promises = body.messages.map(msg => {

        // not target group
        if (msg.chat_id !== chat_id) {
            console.log("wrong chat_id")
            return Promise.resolve()
        }

        console.log("sending")
        return whapi.sendMessageText({typing_time: 0, to: chat_id, body: `echo: ${msg.text.body}`})
    })
    
    Promise.all(promises)
        .then(x => res.sendStatus(200))
        .catch(x => console.log(x))
})

module.exports.handler = serverless(app);
