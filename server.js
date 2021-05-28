/* eslint-disable no-param-reassign */
/* eslint-disable no-return-await */
/* eslint-disable consistent-return */

const http = require('http');
const Koa = require('koa');
const WS = require('ws');

const app = new Koa();

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());
const wsServer = new WS.Server({ server });

const users = ['Botinok1', 'Botinok2'];

app.use(async (ctx, next) => { const origin = ctx.request.get('Origin'); if (!origin) { return await next(); } const headers = { 'Access-Control-Allow-Origin': '*' }; if (ctx.request.method !== 'OPTIONS') { ctx.response.set({ ...headers }); try { return await next(); } catch (e) { e.headers = { ...e.headers, ...headers }; throw e; } } if (ctx.request.get('Access-Control-Request-Method')) { ctx.response.set({ ...headers, 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH' }); if (ctx.request.get('Access-Control-Request-Headers')) { ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Allow-Request-Headers')); } ctx.response.status = 204; } });

wsServer.on('connection', (ws) => {
  const errCallback = (err) => {
    if (err) {
      throw new Error(err);
    }
  };

  ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    switch (data.type) {
      case 'login':
        if (users.includes(data.user)) ws.send(JSON.stringify({ type: 'login', success: 'false' }));
        else {
          ws.id = data.user;
          ws.send(JSON.stringify({ type: 'login', success: 'true', users }), errCallback);
          Array.from(wsServer.clients)
            .filter((o) => o.readyState === WS.OPEN)
            .forEach((o) => o.send(JSON.stringify({ time: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, type: 'userLogin', user: data.user })), errCallback);
          users.push(data.user);
        }
        break;

      case 'chatmessage':
        Array.from(wsServer.clients)
          .filter((o) => o.readyState === WS.OPEN)
          .forEach((o) => o.send(JSON.stringify(data)), errCallback);
        break;

      default:
        break;
    }
  });

  ws.on('close', () => {
    if (ws.id) users.splice(users.indexOf(ws.id), 1);
    Array.from(wsServer.clients)
      .filter((o) => o.readyState === WS.OPEN)
      .forEach((o) => o.send(JSON.stringify({ time: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, type: 'userLogout', user: ws.id })));
  });
});

server.listen(port);
