const serverless = require('serverless-http')
const express = require('express')
const whapi = require('api')('@whapi/v1.8.5#169y7mthhm2j5nv5q');

const {idioms, chores} = require('./constants')
const {chart, get_speciesism, get_chores} = require('./charts')
const {aggregate, mongo} = require("./mongo");

const chat_ids = process.env.CHAT_IDS.split(',')
const is_offline = process.env.IS_OFFLINE

if (is_offline) {
    console.log("offline mode")
}

const app = express()

function verify_api_key(req, res, next) {
    if (req.header('x-api-key') !== process.env.API_KEY) {
        throw new Error("invalid api key")
    }

    next()
}

app.use(verify_api_key)

whapi.auth(process.env.MSG_TOKEN)

async function get_speciesism_chart_url() {
    const pipeline = [
        {$group: {_id: "$userName", count: {$count: {}}}},
        {$sort: {_id: 1}},
    ]
    const docs = await aggregate('Admonitions', pipeline)

    console.log(docs)
    const users = docs.map(x => x["_id"])
    const scores = docs.map(x => x["count"])
    return chart(get_speciesism(users, scores))
}

async function get_chore_score_url() {
    const pipeline = [
        {$group: {_id: {user: "$userName", chore: "$chore"}, count: {$count: {}}}},
        {$sort: {_id: 1}},
    ]
    const docs = await aggregate('Chores', pipeline)

    console.log(docs)
    const userChores = {}
    docs.forEach(doc => {
        const def = {}
        chores.forEach(chore => def[chore.field] = 0)
        userChores[doc["_id"]["user"]] ??= def
        userChores[doc["_id"]["user"]][doc["_id"]["chore"]] = doc["count"]
    })

    return chart(get_chores(userChores))
}

async function perform_chore(chore, msg) {
    const doc = {
        userId: msg.from,
        userName: msg.from_name,
        chore: chore,
        choredAt: new Date()
    }
    const client = await mongo()
    await client.collection("Chores").insertOne(doc)
    await whapi.reactToMessage({emoji: '👌'}, {MessageID: msg.id})
}

async function idiom_stats(msg) {
    const url = await get_speciesism_chart_url()
    await whapi.sendMessageImage({to: msg.chat_id, media: url, quoted: msg.id})
}

async function chore_stats(msg) {
    const url = await get_chore_score_url()
    await whapi.sendMessageImage({to: msg.chat_id, media: url, quoted: msg.id})
}

function get_idioms(msg) {
    let text = msg.text.body
    let idiom_ids = []
    for (let i = 0; i < idioms.length; ++i) {
        const idiom = idioms[i]
        while (text.match(idiom.re)) {
            console.log("matched: " + idiom.re)
            text = text.replace(idiom.re, idiom.replace)
            idiom_ids.push(i)
        }
    }
    return {text, idiom_ids}
}

async function admonish_idioms(msg) {
    let {text, idiom_ids} = get_idioms(msg)
    if (idiom_ids.length === 0) {
        console.log("no triggering idioms found")
        return
    }

    text = `uh oh! it appears you used a speciesist phrase! next time, try '${text}'`
    console.log("triggering idiom(s) detected! admonishing: " + text)

    const documents = idiom_ids.map(idiomId => {
        return {
            userId: msg.from,
            userName: msg.from_name,
            idiomId: idiomId,
            admonishedAt: new Date()
        }
    })
    const client = await mongo()
    await Promise.all([
        client.collection("Admonitions").insertMany(documents),
        whapi.sendMessageText({typing_time: 0, to: msg.chat_id, body: text, quoted: msg.id})
    ])
}

app.post('/webhooks', async (req, res) => {
    const body = JSON.parse(req.body)
    console.log(body);

    const promises = []
    body.messages.forEach(msg => {
        if (msg.source === 'api') {
            console.log("msg is from api")
            return
        }

        // not target group
        if (!chat_ids.includes(msg.chat_id)) {
            console.log("wrong chat_id")
            return
        }

        if (msg.text.body === "/idiomstats") {
            promises.push(idiom_stats(msg))
            return
        }

        for (let chore of chores) {
            if (msg.text.body === `/${chore.field}`) {
                promises.push(perform_chore(chore.field, msg))
                return
            }
        }

        if (msg.text.body === "/chorestats") {
            promises.push(chore_stats(msg))
            return
        }

        promises.push(admonish_idioms(msg))
    })

    try {
        await Promise.all(promises)
        res.sendStatus(200)
    } catch (e) {
        console.log(e)
    }
})

app.get("/idioms", (req, res) => {
    let i = 0
    return res.json(idioms.map(x => {
        return {id: i++, re: x.re.toString(), replace: x.replace}
    }))
})

app.get("/idioms/highscores/img", async (req, res) => {
    const url = await get_speciesism_chart_url();
    res.redirect(url);
})

module.exports.handler = serverless(app);
