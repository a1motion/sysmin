const sysmin = require(`./`);
const app = require(`express`)();
const Redis = require(`ioredis`);

const ws = sysmin.addWs(app);

app.set(`trust proxy`, true);
app.set(`x-powered-by`, false);

app.use(
  sysmin.handler({
    prefix: `sysmin_dev`,
    client: new Redis(),
  })
);
app.use(
  `/client`,
  sysmin.client({
    prefix: `sysmin_dev`,
    client: new Redis(),
    wsPath: `/client`,
    ws,
  })
);

app.listen(3000);
