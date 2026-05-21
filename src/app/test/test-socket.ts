import { io } from "socket.io-client";

async function testChat() {
    const socket = io('http://localhost:3000', {
        auth: { token: 'YOUR_JWT_TOKEN' }
    });
    
    socket.on('connect', () => {
        console.log('Connected:', socket.id);
        
        // Join conversation
        socket.emit('join_conversation', 'CONVERSATION_ID');
    });
    
    socket.on('joined_conversation', (data) => {
        console.log('Joined conversation:', data);
        
        // Send message
        socket.emit('send_message', {
            conversationId: 'CONVERSATION_ID',
            text: 'Hello from test!',
            tempId: '123'
        });
    });
    
    socket.on('new_message', (data) => {
        console.log('Received message:', data);
    });
    
    socket.on('error', (data) => {
        console.error('Socket error:', data);
    });
}

testChat();