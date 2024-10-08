document.addEventListener('DOMContentLoaded', () => {
  const createChatBtn = document.getElementById('createChatBtn');
  const joinChatBtn = document.getElementById('joinChatBtn');
  const secretCodeContainer = document.getElementById('secretCodeContainer');
  const secretCode = document.getElementById('secretCode');
  const chatContainer = document.getElementById('chatContainer');
  const chatBox = document.getElementById('chatBox');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const userList = document.getElementById('userList'); // Element to display users

  // Initialize socket.io connection with WebSocket and reconnection settings
  const socket = io({
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
  });

  let userName = prompt("Enter your username:"); // Prompt for username

  // Listen for connection status


  if (userName) {
    // Display the welcome message
    welcomeMessage.textContent = `${userName}, welcome to the World of Anonymity!`;
    welcomeMessage.style.display = 'block'; // Show the welcome message
}


  socket.on('connect', () => {
      console.log('Connected to server');
  });

  socket.on('disconnect', () => {
      console.log('Disconnected from server');
  });

  socket.on('reconnect_attempt', () => {
      console.log('Attempting to reconnect...');
  });

  // Event listener for creating a chat group
  createChatBtn.addEventListener('click', () => {
      socket.emit('createRoom');  // Emit event to server to create a room
  });

  // Listen for the room code generated by the server
  socket.on('roomCreated', (roomCode) => {
      secretCodeContainer.style.display = 'block';  // Show secret code
      secretCode.textContent = roomCode;            // Display generated room code
      chatContainer.style.display = 'block';        // Show the chat window
  });

  // Event listener for joining a chat group
  joinChatBtn.addEventListener('click', () => {
      const roomCode = prompt("Enter the 6-digit secret code to join the chat:");
      if (roomCode) {
          socket.emit('joinRoom', roomCode, userName);  // Emit event to join room with username
          secretCode.textContent = roomCode;  // Set the displayed room code
      }
  });

  // Listen for successful joining of the room
  socket.on('roomJoined', (data) => {
      alert('You have joined the chat room!');
      chatContainer.style.display = 'block';  // Show chat window
      updateUserList(data.users);  // Update user list display
  });

  // Handle errors when joining a room
  socket.on('error', (message) => {
      alert(message);  // Show error message if room is not found
  });

  // Handle sending messages
  chatForm.addEventListener('submit', (event) => {
      event.preventDefault();  // Prevent default form submission
      const message = chatInput.value;
      const roomCode = secretCode.textContent; // Get the current room code
      if (message && roomCode) {
          socket.emit('sendMessage', { roomCode, message, userName });  // Send message to server
          chatInput.value = '';  // Clear input field
      }
  });

  // Listen for incoming messages
  socket.on('receiveMessage', ({ message, userName, timestamp }) => {
      const messageElement = document.createElement('div');
      messageElement.textContent = `${timestamp} ${userName}: ${message}`;  // Include timestamp and username
      chatBox.appendChild(messageElement);   // Append message to chat box
      chatBox.scrollTop = chatBox.scrollHeight;  // Scroll to the bottom
  });

  // Listen for user disconnection
  socket.on('userDisconnected', (userName) => {
      const messageElement = document.createElement('div');
      messageElement.textContent = `${userName} has left the chat.`; // Notify user disconnect
      chatBox.appendChild(messageElement); 
      chatBox.scrollTop = chatBox.scrollHeight;  // Scroll to the bottom
  });

  // Update the user list in the chat
  function updateUserList(users) {
      userList.innerHTML = ''; // Clear the current list
      users.forEach(user => {
          const userElement = document.createElement('div');
          userElement.textContent = user; // Add user to the list
          userList.appendChild(userElement);
      });
  }

  // Listen for reconnection success
  socket.on('reconnect', (attempt) => {
      console.log(`Reconnected successfully after ${attempt} attempts.`);
  });

  // Listen for reconnection errors
  socket.on('reconnect_error', () => {
      console.log('Reconnect error occurred.');
  });

  // Listen for failed reconnections
  socket.on('reconnect_failed', () => {
      console.log('Failed to reconnect after max attempts.');
  });
});
