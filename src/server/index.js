const client = require(`./client`)
const handler = require(`./handler`)
const expressWsSetup = require(`express-ws`)
const sysmin = {
  handler,
  client,
  addWs: (app) => {
    const expressWs = expressWsSetup(app)
    return expressWs
  },
}
module.exports = sysmin
