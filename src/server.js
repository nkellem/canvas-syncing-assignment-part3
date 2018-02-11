const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/index.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(PORT);

console.log(`Listening on localhost:${PORT}`);

// pass in the http server into socketio and grab the websocket sever as io
const io = socketio(app);

let draws = {};

const onJoined = sock => {
  const socket = sock;

  socket.on('join', data => {
    draws[data.name] = data.coords;

    socket.join('room1');
  });
};

const onUpdateServerStack = sock => {
  const socket = sock;

  socket.on('updateServerStack', data => {
    draws[data.name] = data.coords;

    io.sockets.in('room1').emit('updateClientStack', {name: data.name, coords: data.coords});
  });
};

const onDisconnect = sock => {
  const socket = sock;

  socket.on('disconnect', () => {
    const {name} = socket;
    socket.leave('room1');
    io.sockets.in('room1').emit('deleteOtherClient', {name});

    if (draws[name]) {
      delete draws[name];
    }
  });
};

io.sockets.on('connection', socket => {
  console.log('started');

  onJoined(socket);
  onUpdateServerStack(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
