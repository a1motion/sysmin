import express from "express";
import path from "path";
import { promises as fs } from "fs";

const app = express.Router();
const __DEV__ = process.env.NODE_ENV !== `production`;

const BASE_PATH = __DEV__
  ? path.join(__dirname, `../../build`)
  : path.resolve(__dirname, `..`);

module.exports = (options) => {
  if (!options || !options.client) {
    throw new Error(`No Redis Client Attached`);
  }

  if (!options.ws || options.ws === null) {
    throw new Error(
      `Make sure to call \`{ ws:sysmin.addWs(app) }\` on your root express app in your client config`
    );
  }

  options.key = options.key || `SYSMIN_DEV`;
  options.client.subscribe(options.key);
  options.client.on(`message`, (channgel, message) => {
    options.ws.getWss().clients.forEach((client) => {
      client.send(message);
    });
  });
  app.use((req, res, next) => {
    req.SYSMIN_SKIP = true;
    return next();
  });
  app.use(
    express.static(path.join(BASE_PATH, `client`), {
      index: false,
      maxAge: `1day`,
    })
  );
  app.get(`/ws`, (req, res) => {
    res.end();
  });
  app.ws(`/ws`, (ws) => {
    ws.on(`message`, (msg) => {});
  });
  app.get(`/`, async (req, res) => {
    const indexFile = path.join(BASE_PATH, `client`, `index.html`);
    try {
      const RAW_HTML = (await fs.readFile(indexFile)).toString();
      return res.send(RAW_HTML);
    } catch (err) {
      console.error(`Something went wrong:`, err);
      return res.status(500).send(`Oops, better luck next time!`);
    }
  });
  return app;
};
