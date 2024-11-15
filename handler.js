const serverless = require('serverless-http')
const express = require('express')
const whapi = require('api')('@whapi/v1.8.5#169y7mthhm2j5nv5q');
const chrono = require('chrono-node')
const Splitwise = require('splitwise')

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

async function shop_list(msg) {
    const client = await mongo()
    const docs = await (await client.collection("ShoppingList").find({}, {sort: {itemId: 1}})).toArray()
    let text
    if (docs.length === 0) {
        text = "The shopping list is empty :)"
    } else {
        text = ""
        docs.forEach(x => {
            text += `${x.itemId}: ${x.item}\n`
        })
        text = text.trimEnd()
    }
    await whapi.sendMessageText({typing_time: 0, to: msg.chat_id, body: text, quoted: msg.id})
}

async function shop_add(msg, item) {
    const client = await mongo()
    await client.collection("ShoppingList").insertOne({
        item: item,
        userId: msg.from,
        userName: msg.from_name,
        addedAt: new Date()
    })
    await whapi.reactToMessage({emoji: '👌'}, {MessageID: msg.id})
}

async function shop_remove(msg, items) {
    const client = await mongo()
    await client.collection("ShoppingList").deleteMany({itemId: {"$in": items}})
    await whapi.reactToMessage({emoji: '👌'}, {MessageID: msg.id})
}

async function shop(msg) {
    const toks = msg.text.body.split(/\s+/).filter(x => x.length > 0)
    if (!toks || toks.length <= 1) return

    const cmd = toks[1]
    if (cmd === "list") {
        await shop_list(msg)
    } else if (cmd === "add") {
        const items = toks.slice(2)
        if (items.length === 0) return

        await shop_add(msg, items.join(" "))
    } else if (cmd === "remove") {
        console.log(toks)
        const items = toks.slice(2).map(x => parseInt(x)).filter(x => !isNaN(x))
        if (items.length === 0) return
        console.log(toks)

        await shop_remove(msg, items)
    }
}


async function car_list(msg) {
    const client = await mongo()
    const docs = await (await client.collection("Car").find({endAt: {"$gt": new Date()}}, {sort: {startAt: 1}})).toArray()
    let text
    if (docs.length === 0) {
        text = "The car has no reservations :)"
    } else {
        text = "The car has the following reservations\n"
        docs.forEach(x => {
            text += `${x.userName}: ${x.startAt.toLocaleString()} - ${x.endAt.toLocaleString()}\n`
        })
        text = text.trimEnd()
    }
    await whapi.sendMessageText({typing_time: 0, to: msg.chat_id, body: text, quoted: msg.id})
}

function get_interval(str) {
    const d = chrono.parse(str)
    if (!d) return

    const start = d[0].start.date()
    const end = d[0].end?.date() ?? new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59)

    console.log(`found interval [${start}, ${end}]`)
    return {start, end}
}

async function car_reserve(msg, dates) {
    const interval = get_interval(dates)
    if (!interval) return
    const {start, end} = interval

    const client = await mongo()

    const docs = await (await client.collection("Car").find({
        $or: [
            {startAt: {$gte: start, $lte: end}},
            {endAt: {$gte: start, $lte: end}},
            {
                $and: [
                    {startAt: {$lt: start}},
                    {endAt: {$gt: end}}
                ]
            }
        ]
    })).toArray()

    if (docs.length > 0) {
        let text = "Reservation failed as it overlaps the following:\n"
        docs.forEach(x => {
            text += `${x.userName}: ${x.startAt.toLocaleString()} - ${x.endAt.toLocaleString()}\n`
        })
        text = text.trimEnd()
        await whapi.sendMessageText({typing_time: 0, to: msg.chat_id, body: text, quoted: msg.id})
        return
    }

    await client.collection("Car").insertOne({
        startAt: start,
        endAt: end,
        userId: msg.from,
        userName: msg.from_name,
        addedAt: new Date()
    })
    await whapi.reactToMessage({emoji: '👌'}, {MessageID: msg.id})
}

async function car_unreserve(msg, dates) {
    const interval = get_interval(dates)
    if (!interval) return
    const {start, end} = interval

    const client = await mongo()
    await client.collection("Car").deleteOne({startAt: start, endAt: end})
    await whapi.reactToMessage({emoji: '👌'}, {MessageID: msg.id})
}

async function car(msg) {
    const toks = msg.text.body.split(' ').filter(x => x.length > 0)
    if (!toks || toks.length <= 1) return

    const cmd = toks[1]
    if (cmd === "list") {
        await car_list(msg)
    } else if (cmd === "reserve") {
        const items = toks.slice(2)
        if (items.length === 0) return

        await car_reserve(msg, items.join(' '))
    } else if (cmd === "unreserve") {
        const items = toks.slice(2)
        if (items.length === 0) return

        await car_unreserve(msg, items.join(' '))
    }
}

async function splitwise_list(msg) {
    const sw = Splitwise({
        consumerKey: process.env.SPLITWISE_KEY,
        consumerSecret: process.env.SPLITWISE_SECRET
    })

    const group = await sw.getGroup({id: process.env.SPLITWISE_GROUP_ID})
    const members = new Map()
    group.members.forEach(x => {
        members.set(x.id, x.first_name)
    })

    let text = ""
    group.simplified_debts.forEach(x => {
        text += `${members.get(x.from)} owes ${members.get(x.to)} $${x.amount}\n`
    })
    await whapi.sendMessageText({typing_time: 0, to: msg.chat_id, body: text, quoted: msg.id})
}

async function splitwise(msg) {
    const toks = msg.text.body.split(' ').filter(x => x.length > 0)
    if (!toks || toks.length <= 1) return

    const cmd = toks[1]
    if (cmd === "list") {
        await splitwise_list(msg)
    }
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

        if (msg.text.body.startsWith("/shop")) {
            promises.push(shop(msg))
            return
        }

        if (msg.text.body.startsWith('/car')) {
            promises.push(car(msg))
            return
        }

        if (msg.text.body.startsWith('/splitwise')) {
            promises.push(splitwise(msg))
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
