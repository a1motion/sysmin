const client = require(`./client`)
const handler = require(`./handler`)
const expressWsSetup = require(`express-ws`)
const sysmin = {
  handler,
  client,
  addWs: (app, server) => {
    const expressWs = expressWsSetup(app, server)
    return expressWs
  },
}
module.exports = sysmin
