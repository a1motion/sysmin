import React, { Component } from "react"
import { ReconnectingWebSocket } from "./utils/ReconnectingWebsocket"

export default class extends Component {
  constructor() {
    super()
    this.state = {
      messages: [],
    }
  }
  componentDidMount() {
    const ws = new ReconnectingWebSocket(
      `ws://${window.location.host}${window.location.pathname}ws`
    )
    ws.onmessage = ({ data }) => {
      this.setState((state) => ({
        ...state,
        messages: [JSON.parse(data), ...state.messages],
      }))
    }
  }
  render() {
    const { messages } = this.state
    return (
      <div>
        {messages.map((message) => (
          <pre key={message.request}>
            <code>{JSON.stringify(message, null, 2)}</code>
          </pre>
        ))}
      </div>
    )
  }
}
