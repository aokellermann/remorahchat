# remorahchat

Admonishes speciesist language in whatsapp chats.

## Deploying

This app deploys to AWS lambda based on your AWS CLI's default profile.

Create an account at https://whapi.cloud/ to get an API token.

```sh
# your whapi token
export MSG_TOKEN=XXX

# your chat id
export CHAT_ID=YYY

serverless deploy
```

When deploy completes, it will tell you the lambda's gateway endpoint. In your whapi channel, change the webhooks URL
to <gateway>/webhooks and make sure only the `messages POST` button is toggled.