# sysmin

## Install

```bash
yarn add sysmin
```

## Usage

```js
const express = require('express')
const app = require('app')
const sysmin = require('sysmin')
const redis = require('ioredis')

app.use(sysmin.handler({
  client: new Redis(),
  server: 'SERVER_ID', // optional
  key: 'REDIS_PUB/SUB_KEY', // optional, must be same for handler and client
}))

app.use()

app.use('/metrics', sysmin.client({
  client: new Redis(),
  ws: sysmin.addWs(app), // adds websocket support to express
  key: 'REDIS_PUB/SUB_KEY', // optional, must be same for handler and client
}))

app.listen(3000)
```

