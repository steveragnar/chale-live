const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let waitingUser = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('ready', () => {
  if (waitingUser)  {
    const room = socket.id + '#' + waitingUser.id;
    socket.join(room);
    waitingUser.join(room);

    io.to(room).emit('matched', { room, initiator: waitingUser.id });
    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit('waiting');
  }

  socket.on('message', ({ room, text }) => {
    socket.to(room).emit('message', { text });
  });

  // WebRTC signaling
  socket.on('offer', ({ room, offer }) => {
    socket.to(room).emit('offer', { offer });
  });

  socket.on('answer', ({ room, answer }) => {
    socket.to(room).emit('answer', { answer });
  });

  socket.on('ice-candidate', ({ room, candidate }) => {
    socket.to(room).emit('ice-candidate', { candidate });
  });

  socket.on('disconnect', () => {
    if (waitingUser === socket) waitingUser = null;
  });
});

server.listen(process.env.PORT || 3000, () => { 
   console.log('Chale running on http://localhost:3000');
});
