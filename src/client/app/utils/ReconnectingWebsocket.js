/* eslint func-names: 0, no-unused-vars: 0, no-empty-function: 0 */

export const ReconnectingWebSocket = (() => {
  function ReconnectingWebSocket(url, protocols, options) {
    const settings = {
      debug: false,
      automaticOpen: true,
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      reconnectDecay: 1.5,
      timeoutInterval: 2000,
      maxReconnectAttempts: null,
      binaryType: `blob`,
    }
    if (!options) {
      options = {}
    }

      for (const key in settings) { // eslint-disable-line
      if (typeof options[key] !== `undefined`) {
        this[key] = options[key]
      } else {
        this[key] = settings[key]
      }
    }

    this.url = url

    this.reconnectAttempts = 0

    this.readyState = 0

    this.protocol = null

    const self = this
    let ws
    let forcedClose = false
    let timedOut = false
    const eventTarget = document.createElement(`div`)

    eventTarget.addEventListener(`open`, (event) => {
      self.onopen(event)
    })
    eventTarget.addEventListener(`close`, (event) => {
      self.onclose(event)
    })
    eventTarget.addEventListener(`connecting`, (event) => {
      self.onconnecting(event)
    })
    eventTarget.addEventListener(`message`, (event) => {
      self.onmessage(event)
    })
    eventTarget.addEventListener(`error`, (event) => {
      self.onerror(event)
    })

    this.addEventListener = eventTarget.addEventListener.bind(eventTarget)
    this.removeEventListener = eventTarget.removeEventListener.bind(eventTarget)
    this.dispatchEvent = eventTarget.dispatchEvent.bind(eventTarget)

    function generateEvent(s, args) {
      const evt = document.createEvent(`CustomEvent`)
      evt.initCustomEvent(s, false, false, args)
      return evt
    }

    this.open = function(reconnectAttempt) {
      ws = new WebSocket(self.url, protocols || [])
      ws.binaryType = this.binaryType

      if (reconnectAttempt) {
        if (
          this.maxReconnectAttempts &&
          this.reconnectAttempts > this.maxReconnectAttempts
        ) {
          return
        }
      } else {
        eventTarget.dispatchEvent(generateEvent(`connecting`))
        this.reconnectAttempts = 0
      }

      if (self.debug || ReconnectingWebSocket.debugAll) {
        console.debug(`ReconnectingWebSocket`, `attempt-connect`, self.url)
      }

      const localWs = ws
      const timeout = setTimeout(() => {
        if (self.debug || ReconnectingWebSocket.debugAll) {
          console.debug(`ReconnectingWebSocket`, `connection-timeout`, self.url)
        }
        timedOut = true
        localWs.close()
        timedOut = false
      }, self.timeoutInterval)

      ws.onopen = function(event) {
        clearTimeout(timeout)
        if (self.debug || ReconnectingWebSocket.debugAll) {
          console.debug(`ReconnectingWebSocket`, `onopen`, self.url)
        }
        self.protocol = ws.protocol
        self.readyState = WebSocket.OPEN
        self.reconnectAttempts = 0
        const e = generateEvent(`open`)
        e.isReconnect = reconnectAttempt
        reconnectAttempt = false
        eventTarget.dispatchEvent(e)
      }

      ws.onclose = function(event) {
        clearTimeout(timeout)
        ws = null
        if (forcedClose) {
          self.readyState = WebSocket.CLOSED
          eventTarget.dispatchEvent(generateEvent(`close`))
        } else {
          self.readyState = WebSocket.CONNECTING
          const e = generateEvent(`connecting`)
          e.code = event.code
          e.reason = event.reason
          e.wasClean = event.wasClean
          eventTarget.dispatchEvent(e)
          if (!reconnectAttempt && !timedOut) {
            if (self.debug || ReconnectingWebSocket.debugAll) {
              console.debug(`ReconnectingWebSocket`, `onclose`, self.url)
            }
            eventTarget.dispatchEvent(generateEvent(`close`))
          }

          const timeout =
            self.reconnectInterval *
            Math.pow(self.reconnectDecay, self.reconnectAttempts)
          setTimeout(
            () => {
              self.reconnectAttempts++
              self.open(true)
            },
            timeout > self.maxReconnectInterval
              ? self.maxReconnectInterval
              : timeout
          )
        }
      }
      ws.onmessage = function(event) {
        if (self.debug || ReconnectingWebSocket.debugAll) {
          console.debug(
            `ReconnectingWebSocket`,
            `onmessage`,
            self.url,
            event.data
          )
        }
        const e = generateEvent(`message`)
        e.data = event.data
        eventTarget.dispatchEvent(e)
      }
      ws.onerror = function(event) {
        if (self.debug || ReconnectingWebSocket.debugAll) {
          console.debug(`ReconnectingWebSocket`, `onerror`, self.url, event)
        }
        eventTarget.dispatchEvent(generateEvent(`error`))
      }
    }

    // Whether or not to create a websocket upon instantiation
    if (this.automaticOpen === true) {
      this.open(false)
    }

    /**
     * Transmits data to the server over the WebSocket connection.
     *
     * @param data a text string, ArrayBuffer or Blob to send to the server.
     */
    this.send = function(data) {
      if (ws) {
        if (self.debug || ReconnectingWebSocket.debugAll) {
          console.debug(`ReconnectingWebSocket`, `send`, self.url, data)
        }
        return ws.send(data)
      }
      throw `INVALID_STATE_ERR : Pausing to reconnect websocket`
    }

    /**
     * Closes the WebSocket connection or connection attempt, if any.
     * If the connection is already CLOSED, this method does nothing.
     */
    this.close = function(code, reason) {
      // Default CLOSE_NORMAL code
      if (typeof code === `undefined`) {
        code = 1000
      }
      forcedClose = true
      if (ws) {
        ws.close(code, reason)
      }
    }

    /**
     * Additional public API method to refresh the connection if still open (close, re-open).
     * For example, if the app suspects bad data / missed heart beats, it can try to refresh.
     */
    this.refresh = function() {
      if (ws) {
        ws.close()
      }
    }
  }

  /**
   * An event listener to be called when the WebSocket connection's readyState changes to OPEN;
   * this indicates that the connection is ready to send and receive data.
   */
  ReconnectingWebSocket.prototype.onopen = function(event) {}
  /** An event listener to be called when the WebSocket connection's readyState changes to CLOSED. */
  ReconnectingWebSocket.prototype.onclose = function(event) {}
  /** An event listener to be called when a connection begins being attempted. */
  ReconnectingWebSocket.prototype.onconnecting = function(event) {}
  /** An event listener to be called when a message is received from the server. */
  ReconnectingWebSocket.prototype.onmessage = function(event) {}
  /** An event listener to be called when an error occurs. */
  ReconnectingWebSocket.prototype.onerror = function(event) {}

  /**
   * Whether all instances of ReconnectingWebSocket should log debug messages.
   * Setting this to true is the equivalent of setting all instances of ReconnectingWebSocket.debug to true.
   */
  ReconnectingWebSocket.debugAll = false

  return ReconnectingWebSocket
})()
