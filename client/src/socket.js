import { io } from 'socket.io-client';

const URL = import.meta.env.PROD
    ? window.location.origin
    : 'http://localhost:3000';

const socket = io(URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
});

export default socket;
