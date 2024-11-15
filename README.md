# remorahchat

WhatsApp bot for the Remorah group house.

## Features

### Chore tracking

Log chore completion with the following

- `/trash`
- `/recycling`
- `/dishes`
- `/bins`
- `/surfaces`
- `/vacuum`

### Car reservation

- `/car reserve <start datetime> <end datetime>`
  - ex `/car reserve tomorrow 2pm to 6pm`
  - uses the lib [chrono](https://github.com/wanasit/chrono) for natural language date parsing
  - will alert you if car is already reserved during this time
- `/car unreserve <start datetime> <end datetime>`
- `/car list`
  - lists all reservations

### Shopping list

- `/shop add a couple lightbulbs`
- `/shop list`
  - returns shopping item IDs as well
- `/shop remove <item ID>...`
  - ex. `/shop remove 16 4`

### Admonish speciesist language

If you have the gall to use [anti-animal language](https://www.peta.org/features/animal-friendly-idioms/) as defined
by PETA in a WhatsApp chat, the configured user will reply to that message with an animal-friendly alternative:

![](images/image1.png)

High scores will be tracked. Simply send a message with just the text
`/idiomstats` to retrieve this data:

![](images/image2.png)

## Setup

### AWS

This app deploys to AWS lambda based on your AWS CLI's default profile.

The following parameter store keys need to be populated:
- `/whapi/token`: API token from Whapi
- `/whatsapp/chat_ids`: comma separated chat IDs to enable the bot in. For regular chats you can find id using this endpoint: https://whapi.readme.io/reference/getchats. For group chats you can find id using this endpoint: https://whapi.readme.io/reference/getgroups
- `/mongo/conn`: mongodb connection string
- `/key`: API key to access your node server (you can just generate a UUID)

### WhatsApp API

Create an account at https://whapi.cloud/ to get an API token.

When lambda deploy completes, it will tell you the lambda's gateway endpoint. In your whapi channel, change the webhooks URL
to `gateway/webhooks` where `gateway` is the lambda gateway. Make sure only the `messages POST` button is toggled.


To send your node server's API key with all webhook requests:

`PATCH https://gate.whapi.cloud/settings`
```json
{
  "webhooks": [
    {
      "events": [
        {
          "type": "messages",
          "method": "post"
        }
      ],
      "mode": "body",
      "headers": {
        "x-api-key": "yourapikey"
      },
      "url": "https://yourgateway.com/webhooks"
    }
  ]
}
```

### Mongo 

You can get a free shared cluster on Mongo Atlas.

#### Triggers

To set up shop item ID auto increment, follow the instructions here: https://www.mongodb.com/resources/products/platform/mongodb-auto-increment
and use the following function code

```js
exports = async function(changeEvent) {
    var docId = changeEvent.fullDocument._id;
    
    const countercollection = context.services.get("remorahchat").db(changeEvent.ns.db).collection("counters");
    const shopcollection = context.services.get("remorahchat").db(changeEvent.ns.db).collection(changeEvent.ns.coll);
    
    var counter = await countercollection.findOneAndUpdate({_id: changeEvent.ns },{ $inc: { seq_value: 1 }}, { returnNewDocument: true, upsert : true});
    var updateRes = await shopcollection.updateOne({_id : docId},{ $set : {itemId : counter.seq_value}});
    
    console.log(`Updated ${JSON.stringify(changeEvent.ns)} with counter ${counter.seq_value} result : ${JSON.stringify(updateRes)}`);
};
````

## Deploying

```sh
npm i
serverless deploy
```
