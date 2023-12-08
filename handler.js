const serverless = require('serverless-http')
const express = require('express')
const whapi = require('api')('@whapi/v1.7.5#20a0zlpqylhix');
const pg = require('pg')
const app = express()

const chat_id = process.env.CHAT_ID
const msg_token = process.env.MSG_TOKEN
const pg_conn = process.env.PG_CONN
const is_offline = process.env.IS_OFFLINE

if (is_offline) {
    console.log("offline mode")
}


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

        if (msg.text.body === "/idiomstats") {
            const client = new pg.Client({ connectionString: pg_conn, ssl: { rejectUnauthorized: false}})
            return client.connect()
                .then(x => client.query("select user_name, count(*) as count from remorahchat.admonition group by user_name order by 2 desc, 1"))
                .then(x => {
                    let text = "speciesism high scores:\n"
                    for (const row of x.rows) {
                        text += `${row["user_name"]}: ${row["count"]}\n`
                    }
                    text = text.trimEnd()
                    whapi.auth(msg_token);
                    return whapi.sendMessageText({typing_time: 0, to: chat_id, body: text, quoted: msg.id})
                })
        }

        let text
        let idiom_id
        for (let i = 0; i < idioms.length; ++i) {
            const idiom = idioms[i]
            if (msg.text.body.match(idiom.re)) {
                console.log("matched: " + idiom.re)
                const replaced = msg.text.body.replace(idiom.re, idiom.replace)
                text = `uh oh! it appears you used a speciesist phrase! next time, try '${replaced}'`
                idiom_id = i
                break
            }
        }

        if (!text) {
            console.log("no triggering idioms found")
            return Promise.resolve()
        }

        console.log("triggering idiom detected! admonishing: " + text)

        const db = function() {
            const client = new pg.Client({ connectionString: pg_conn, ssl: { rejectUnauthorized: false}})
            return client.connect()
                .then(x => client.query("insert into remorahchat.admonition (user_id, user_name, idiom_id) values ($1, $2, $3)",
                    [msg.from, msg.from_name, idiom_id]))
        }

        if (is_offline) {
            return db()
        } else {
            whapi.auth(msg_token);
            return whapi.sendMessageText({typing_time: 0, to: chat_id, body: text, quoted: msg.id})
                .then(x => db())
        }
    })

    Promise.all(promises)
        .then(x => res.sendStatus(200))
        .catch(x => console.log(x))
})

module.exports.handler = serverless(app);
