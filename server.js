const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.set("view engine", "ejs");

// Store active users: socket.id -> username
const allUsers = new Map();

app.get('/', (req, res) => {
  res.render("index");
});

io.on('connection', (socket) => {
  // User joins
  socket.on("joining", (username) => {
    if (!username) return;
    allUsers.set(socket.id, username.trim());
    console.log(`${username} joined (${socket.id})`);

    // Broadcast updated users list
    io.emit("users", Array.from(allUsers.values()));
    io.emit("user_notice", `${username} joined the chat`);
  });

  // Global / Group message
  socket.on("groupmsg", (user, msg) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    io.emit("groupmsg", {
      sender: user,
      text: msg,
      time: time
    });
  });

  // Private 1-on-1 message
  socket.on("privately", (sender, targetUser, msg) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const payload = {
      sender,
      to: targetUser,
      text: msg,
      time: time
    };

    // Find recipient's socket ID
    let targetSocketId = null;
    for (const [sId, name] of allUsers.entries()) {
      if (name.toLowerCase() === targetUser.toLowerCase()) {
        targetSocketId = sId;
        break;
      }
    }

    // Send to recipient
    if (targetSocketId) {
      io.to(targetSocketId).emit("privately", payload);
    }
    // Also send back to sender so their sender view updates
    socket.emit("privately", payload);
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    const username = allUsers.get(socket.id);
    if (username) {
      allUsers.delete(socket.id);
      console.log(`${username} disconnected`);
      io.emit("users", Array.from(allUsers.values()));
      io.emit("user_notice", `${username} left the chat`);
    }
  });
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});