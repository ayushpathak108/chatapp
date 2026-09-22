const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);

const io = new Server(server);

app.set("view engine", "ejs"); // or pug/hbs/etc.
const alluser=new Map()


app.get('/', (req, res) => {
  res.render("index")
});
let i=1;
io.on('connection', (socket) => {
  socket.on("joining",(msg)=>{
    console.log(msg+" joined")
   
    io.emit("users",Array.from( alluser.set("xx"+ i++ +" ",msg).values()))
    
  })
  socket.on("privately",(sender,user,msgg)=>{
    console.log(msgg,user)
    io.emit("privately",sender,msgg,user)
  })
 socket.on("groupmsg",(user,msg)=>{
  io.emit("groupmsg",user,msg);
 })

});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});