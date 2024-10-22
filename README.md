# remorahchat

WhatsApp bot for the Remorah group house.

## Features

### Chore tracking

Send the message `/trash` or `/recycling` to log
that you completed a chore.

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

### WhatsApp API

Create an account at https://whapi.cloud/ to get an API token.

When lambda deploy completes, it will tell you the lambda's gateway endpoint. In your whapi channel, change the webhooks URL
to `gateway/webhooks` where `gateway` is the lambda gateway. Make sure only the `messages POST` button is toggled.

### Mongo 

You can get a free shared cluster on Mongo Atlas.

## Deploying

```sh
npm i
serverless deploy
```
