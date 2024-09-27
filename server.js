const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));

const rooms = {};  // Store room data

io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle creating a room
    socket.on('createRoom', () => {
        const roomCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit code
        rooms[roomCode] = { users: [] };  // Create a new room with the code
        socket.join(roomCode);  // Join the socket to the new room
        socket.roomCode = roomCode;  // Store the room code in the socket session
        socket.emit('roomCreated', roomCode);  // Send room code to client
        console.log(`Room ${roomCode} created`);
    });

    // Handle joining a room
    socket.on('joinRoom', (roomCode, userName) => {
        if (rooms[roomCode]) {
            socket.join(roomCode);  // Join the existing room
            rooms[roomCode].users.push(userName); // Add user to the room
            socket.roomCode = roomCode;  // Store the room code in the socket session
            socket.emit('roomJoined', { roomCode, users: rooms[roomCode].users });  // Acknowledge room join with user list
            console.log(`User ${userName} joined room ${roomCode}`);
        } else {
            socket.emit('error', 'Room not found');  // Send error if room doesn't exist
        }
    });

    // Handle sending messages in the room
    socket.on('sendMessage', (data) => {
        const { roomCode, message, userName } = data;
        const timestamp = new Date().toLocaleTimeString();  // Get current timestamp
        if (rooms[roomCode]) {
            const formattedMessage = { message, userName, timestamp };  // Format message with user info
            io.to(roomCode).emit('receiveMessage', formattedMessage);  // Broadcast message to all users in the room
            console.log(`Message sent to room ${roomCode}: ${formattedMessage.message}`);
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected');
        if (socket.roomCode) {
            const roomCode = socket.roomCode;
            // Remove user from the room's user list
            rooms[roomCode].users = rooms[roomCode].users.filter(user => user !== socket.userName);
            // Notify other users about the disconnection
            socket.to(roomCode).emit('userDisconnected', socket.userName);
            socket.leave(roomCode);  // Leave the room
        }
    });
});

server.listen(3001, () => {
    console.log('Server is running on port 3001');
});
