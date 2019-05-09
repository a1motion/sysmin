import onHeaders from "on-headers"
import onFinished from "on-finished"
import nanoid from "nanoid"

const IGNORED_HEADERS = [
  `dnt`,
  `sec-ch-ua`,
  `sec-fetch-mode`,
  `sec-fetch-dest`,
  `sec-fetch-site`,
  `accept`,
  `host`,
  `accept-language`,
  `sec-fetch-user`,
  `accept-encoding`,
  `upgrade-insecure-requests`,
]

/* Utils copied fom expressjs/morgan */
function getip(req) {
  return (
    req.ip ||
    req._remoteAddress ||
    (req.connection && req.connection.remoteAddress) ||
    undefined
  )
}
function recordStartTime() {
  this._startAt = process.hrtime()
  this._startTime = new Date()
}
function headersSent(res) {
  return typeof res.headersSent !== `boolean`
    ? Boolean(res._header)
    : res.headersSent
}

module.exports = (options) => {
  if (!options || !options.client) {
    throw new Error(`No Redis Client Attached`)
  }
  options.key = options.key || `SYSMIN_DEV`
  options.server = options.server || nanoid()
  return (req, res, next) => {
    req._requestID = nanoid()
    /* basic req/res timings & meta data from expressjs/morgan */
    req._startAt = undefined
    req._startTime = undefined
    req._remoteAddress = getip(req)

    res._startAt = undefined
    res._startTime = undefined

    recordStartTime.call(req)
    const getResponseTime = () => {
      if (!req._startAt || !res._startAt) {
        // missing request and/or response start time
        return -1
      }

      // calculate diff
      const ms =
        (res._startAt[0] - req._startAt[0]) * 1e3 +
        (res._startAt[1] - req._startAt[1]) * 1e-6

      // return truncated value
      return ms.toFixed(3)
    }
    function logRequest() {
      if (req.SYSMIN_SKIP) {
        return
      }
      const reqHeaders = Object.assign({}, req.headers)
      IGNORED_HEADERS.forEach((header) => {
        reqHeaders[header] = undefined
      })
      options.client.publish(
        options.key,
        JSON.stringify({
          server: options.server,
          request: req._requestID,
          url: req.originalUrl || req.url,
          method: req.method,
          responseTime: Number(getResponseTime()),
          time: new Date(),
          status: headersSent(res) ? Number(res.statusCode) : undefined,
          req: {
            headers: reqHeaders,
          },
          res: {
            headers: res.getHeaders(),
          },
        })
      )
    }

    onHeaders(res, recordStartTime)
    onFinished(res, logRequest)
    next()
  }
}
