const serverless = require('serverless-http')
const express = require('express')
const whapi = require('api')('@whapi/v1.8.5#169y7mthhm2j5nv5q');
const { MongoClient, ServerApiVersion } = require('mongodb')
const app = express()

const chat_ids = process.env.CHAT_IDS.split(',')
const msg_token = process.env.MSG_TOKEN
const mongo_conn = process.env.MONGO_CONN
const is_offline = process.env.IS_OFFLINE

if (is_offline) {
    console.log("offline mode")
}

whapi.auth(msg_token);

const idioms = [
    {
        "re": /a bird in the hand is worth two in the bush/i,
        "replace": "an ace in the hand is worth two in the deck"
    },
    {
        "re": /(act\w*) like an animal/i,
        "replace": "$1 like an ogre"
    },
    {
        "re": /a feather in your cap/i,
        "replace": "a flower in your cap"
    },
    {
        "re": /ants in your pants/i,
        "replace": "itches in your britches"
    },
    {
        "re": /(back\w*) the wrong horse/i,
        "replace": "$1 the wrong team"
    },
    {
        "re": /badger/i,
        "replace": "bother"
    },
    {
        "re": /bark up the wrong tree/i,
        "replace": "chase down the wrong lead"
    },
    {
        "re": /bats in (\w+) belfry/i,
        "replace": "noodles in $1 noggin"
    },
    {
        "re": /be (\w+) guinea pig/i,
        "replace": "be $1 test tube"
    },
    {
        "re": /beat(\w*) a dead horse/i,
        "replace": "feed$1 a fed horse"
    },
    {
        "re": /bee(\w+) in (\w+) bonnet/i,
        "replace": "thorn$1 in $2 side"
    },
    {
        "re": /bigger fish to fry/i,
        "replace": "bigger fish to free"
    },
    {
        "re": /bird\s?brain/i,
        "replace": "pea brain"
    },
    {
        "re": /blind as a bat/i,
        "replace": "blind as the eyes on a potato"
    },
    {
        "re": /bring home the bacon/i,
        "replace": "bring home the bagels"
    },
    {
        "re": /build a better mousetrap/i,
        "replace": "build a better mouse pad"
    },
    {
        "re": /bull in a china shop/i,
        "replace": "tornado in a glass factory"
    },
    {
        "re": /old dog new tricks/i,
        "replace": "old clown new tricks"
    },
    {
        "re": /cash cow/i,
        "replace": "moneymaker"
    },
    {
        "re": /catch more flies with honey/i,
        "replace": "befriend more flies with molasses"
    },
    {
        "re": /chicken out/i,
        "replace": "lose your nerve"
    },
    {
        "re": /over spilt milk/i,
        "replace": "over spilt silk"
    },
    {
        "re": /curiosity killed the cat/i,
        "replace": "mind your own business"
    },
    {
        "re": /dirty dog/i,
        "replace": "filthy fiend"
    },
    {
        "re": /dirty rat/i,
        "replace": "dirty rascal"
    },
    {
        "re": /dog and pony show/i,
        "replace": "halftime show"
    },
    {
        "re": /dog[-\s]eat[-\s]dog world/i,
        "replace": "cut-throat world"
    },
    {
        "re": /dogfight/i,
        "replace": "free-for-all"
    },
    {
        "re": /chickens before they hatch/i,
        "replace": "chips before they're cashed"
    },
    {
        "re": /eat crow/i,
        "replace": "eat your words"
    },
    {
        "re": /((ate)|(eat\w*)) like a pig/i,
        "replace": "gluttonize"
    },
    {
        "re": /every dog has its day/i,
        "replace": "every dog has to play"
    },
    {
        "re": /fish or cut bait/i,
        "replace": "cook or get out of the kitchen"
    },
    {
        "re": /fly in (\w+) ointment/i,
        "replace": "sand in $1 gears"
    },
    {
        "re": /fox guarding the henhouse/i,
        "replace": "vampire guarding the blood bank"
    },
    {
        "re": /get off (\w+) high horse/i,
        "replace": "come down off $1 pedestal"
    },
    {
        "re": /to the dogs/i,
        "replace": "to pot"
    },
    {
        "re": /have a dog in this fight/i,
        "replace": "have a stake in this game"
    },
    {
        "re": /hold your horses/i,
        "replace": "cool your jets"
    },
    {
        "re": /horsing around/i,
        "replace": "messing around"
    },
    {
        "re": /two birds with one stone/i,
        "replace": "two birds with one scone"
    },
    {
        "re": /let the cat out of the bag/i,
        "replace": "spill the beans"
    },
    {
        "re": /like a chicken with its head cut off/i,
        "replace": "like your hair is on fire"
    },
    {
        "re": /cat who swallowed the canary/i,
        "replace": "guilty as sin"
    },
    {
        "re": /mad as a march hare/i,
        "replace": "mad as a hatter"
    },
    {
        "re": /madder than a wet hen/i,
        "replace": "madder than an internet troll"
    },
    {
        "re": /silk purse out of a sow's ear/i,
        "replace": "diamond bracelet out of a lump of coal"
    },
    {
        "re": /milk it for all it's worth/i,
        "replace": "juice it for all it's worth"
    },
    {
        "re": /more than one way to skin a cat/i,
        "replace": "more than one way to peel an orange"
    },
    {
        "re": /my first rodeo/i,
        "replace": "my first roadshow"
    },
    {
        "re": /off the hook/i,
        "replace": "in the clear"
    },
    {
        "re": "trick pony",
        "replace": "trick magician"
    },
    {
        "re": /can of worms/i,
        "replace": "pandora's box"
    },
    {
        "re": /like sardines/i,
        "replace": "like pickles"
    },
    {
        "re": /parrot/i,
        "replace": "mimic"
    },
    {
        "re": /pig out/i,
        "replace": "hoover it up"
    },
    {
        "re": /pig\s*headed/i,
        "replace": "hardheaded"
    },
    {
        "re": /pony up/i,
        "replace": "pay up"
    },
    {
        "re": /rabbit out of a hat/i,
        "replace": "coin out of an ear"
    },
    {
        "re": /wool over your eyes/i,
        "replace": "polyester over your eyes"
    },
    {
        "re": /pussyfoot(\w*) around/i,
        "replace": "tread$1 lightly"
    },
    {
        "re": /all (\w+) eggs in one basket/i,
        "replace": "all $! berries in one basket"
    },
    {
        "re": /put lipstick on a pig/i,
        "replace": "gild the lily"
    },
    {
        "re": /cart before the horse/i,
        "replace": "caboose before the engine"
    },
    {
        "re": /cold turkey/i,
        "replace": "cold tofu"
    },
    {
        "re": /rat out/i,
        "replace": "nark"
    },
    {
        "re": /ruffle your feathers/i,
        "replace": "mess up your hair"
    },
    {
        "re": /shoot(\w*) fish in a barrel/i,
        "replace": "steal$1 candy from a baby"
    },
    {
        "re": /sitting duck/i,
        "replace": "easy target"
    },
    {
        "re": /smell a rat/i,
        "replace": "smell a rotten apple"
    },
    {
        "re": /snail mail/i,
        "replace": "molasses mail"
    },
    {
        "re": /stubborn as a mule/i,
        "replace": "stubborn as a fool"
    },
    {
        "re": /talk(\w*) turkey/i,
        "replace": "talk$1 tofurky"
    },
    {
        "re": /dog won't hunt/i,
        "replace": "boat won't float"
    },
    {
        "re": /gets my goat/i,
        "replace": "gets my goatee"
    },
    {
        "re": /straw that broke the camel's back/i,
        "replace": "strawberry that broke the gardener's basket"
    },
    {
        "re": /world is (\w+) oyster/i,
        "replace": "world is $1 oyster mushroom"
    },
    {
        "re": /walk(\w*) on egg shells/i,
        "replace": "walk$1 on thin ice"
    },
    {
        "re": /weasel/i,
        "replace": "con man"
    },
    {
        "re": /wild goose\s*chase/i,
        "replace": "wild gooseberry chase"
    },
    {
        "re": /wolf in sheep's clothing/i,
        "replace": "flim-flam man"
    },
    {
        "re": /your goose is cooked/i,
        "replace": "you're dead in the water"
    }
]

const chores = [
    {
        label: 'Trash',
        field: 'trash',
        color: [255, 99, 132]
    },
    {
        label: 'Recycling',
        field: 'recycling',
        color: [75, 192, 192]
    },
    {
        label: 'Dishes',
        field: 'dishes',
        color: [255, 159, 64]
    }
]

const mongo_client = function() {
    const client = new MongoClient(mongo_conn, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    return client.connect().then(client => client.db("RemorahChat"))
}

const get_high_score_url = function () {
    const pipeline = [
        { $group: { _id: "$userName", count: { $count: { } } } },
        { $sort: { _id: 1 } },
    ]
    return mongo_client()
        .then(client => client.collection("Admonitions").aggregate(pipeline))
        .then(cursor => cursor.toArray())
        .then(x => {
            console.log(x)
            const users = x.map(x => x["_id"])
            const scores = x.map(x => x["count"])
            const chart = {
                type: 'bar',
                data: {
                    labels: users,
                    datasets: [
                        {
                            label: 'Speciesist Utterances',
                            data: scores,
                            backgroundColor: [
                                "rgba(255, 99, 132, 0.2)",
                                "rgba(255, 159, 64, 0.2)",
                                "rgba(255, 205, 86, 0.2)",
                                "rgba(75, 192, 192, 0.2)",
                                "rgba(54, 162, 235, 0.2)",
                            ],
                            borderColor: [
                                "rgb(255, 99, 132)",
                                "rgb(255, 159, 64)",
                                "rgb(255, 205, 86)",
                                "rgb(75, 192, 192)",
                                "rgb(54, 162, 235)",
                            ],
                            fill: false,
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    scales: {
                        yAxes: [
                            {
                                ticks: {
                                    beginAtZero: true,
                                    stepSize: 1
                                }
                            }
                        ]
                    }
                }
            }

            return "https://quickchart.io/chart?c=" + JSON.stringify(chart)
        })
}

const get_chore_score_url = function () {
    const pipeline = [
        { $group: { _id: { user: "$userName", chore: "$chore" }, count: { $count: { } } } },
        { $sort: { _id: 1 } },
    ]
    return mongo_client()
        .then(client => client.collection("Chores").aggregate(pipeline))
        .then(cursor => cursor.toArray())
        .then(x => {
            console.log(x)
            const d = {}
            x.forEach(doc => {
                const def = {}
                chores.forEach(chore => def[chore.field] = 0)
                d[doc["_id"]["user"]] ??= def
                d[doc["_id"]["user"]][doc["_id"]["chore"]] = doc["count"]
            })
            const users = Object.keys(d)
            const chart = {
                type: 'bar',
                data: {
                    labels: users,
                    datasets: chores.map(chore => { return {
                        label: chore.label,
                        data: users.map(user => d[user][chore.field]),
                        backgroundColor: `rgba(${chore.color[0]}, ${chore.color[1]}, ${chore.color[2]}, 0.2)`,
                        borderColor: `rgb(${chore.color[0]}, ${chore.color[1]}, ${chore.color[2]})`,
                        fill: false,
                        borderWidth: 1
                    }}),
                },
                options: {
                    scales: {
                        yAxes: [
                            {
                                ticks: {
                                    beginAtZero: true,
                                    stepSize: 1
                                }
                            }
                        ]
                    }
                }
            }

            return "https://quickchart.io/chart?c=" + JSON.stringify(chart)
        })
}

const perform_chore = function (chore, msg) {
    const doc = {
        userId: msg.from,
        userName: msg.from_name,
        chore: chore,
        choredAt: new Date()
    }
    return mongo_client()
        .then(client => client.collection("Chores").insertOne(doc))
        .then(_ => whapi.reactToMessage({emoji: '👌'}, {MessageID: msg.id}))
}

app.post('/webhooks', (req, res) => {
    const body = JSON.parse(req.body)

    console.log(body);
    const promises = body.messages.map(msg => {

        if (msg.source === 'api') {
            console.log("msg is from api")
            return Promise.resolve()
        }

        // not target group
        if (!chat_ids.includes(msg.chat_id)) {
            console.log("wrong chat_id")
            return Promise.resolve()
        }

        if (msg.text.body === "/idiomstats") {
            return get_high_score_url().then(url => {
                return whapi.sendMessageImage({to: msg.chat_id, media: url, quoted: msg.id})
            })
        }

        for (let chore of chores) {
            if (msg.text.body === `/${chore.field}`) {
                return perform_chore(chore.field, msg)
            }
        }

        if (msg.text.body === "/chorestats") {
            return get_chore_score_url().then(url => {
                return whapi.sendMessageImage({to: msg.chat_id, media: url, quoted: msg.id})
            })
        }

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

        if (idiom_ids.length === 0) {
            console.log("no triggering idioms found")
            return Promise.resolve()
        }

        text = `uh oh! it appears you used a speciesist phrase! next time, try '${text}'`
        console.log("triggering idiom(s) detected! admonishing: " + text)

        const db = function () {
            const documents = idiom_ids.map(idiomId => { return {
                userId: msg.from,
                userName: msg.from_name,
                idiomId: idiomId,
                admonishedAt: new Date()
            }})
            return mongo_client()
                .then(client => client.collection("Admonitions").insertMany(documents))
        }

        if (is_offline) {
            return db()
        } else {
            return whapi.sendMessageText({typing_time: 0, to: msg.chat_id, body: text, quoted: msg.id})
                .then(x => db())
        }
    })

    Promise.all(promises)
        .then(x => res.sendStatus(200))
        .catch(x => console.log(x))
})

app.get("/idioms", (req, res) => {
    let i = 0
    return res.json(idioms.map(x => {
        return {id: i++, re: x.re.toString(), replace: x.replace}
    }))
})

app.get("/idioms/highscores/img", (req, res) => {
    return get_high_score_url().then(url => res.redirect(url))
})

module.exports.handler = serverless(app);
