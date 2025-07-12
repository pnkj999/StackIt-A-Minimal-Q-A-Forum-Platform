import io from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    connect(url = process.env.REACT_APP_API_URL || 'http://localhost:5000') {
        if (this.socket) {
            this.disconnect();
        }

        this.socket = io(url, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
        });

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.isConnected = false;
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    joinUserRoom(userId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('join', userId);
        }
    }

    onNotification(callback) {
        if (this.socket) {
            this.socket.on('notification', callback);
        }
    }

    offNotification(callback) {
        if (this.socket) {
            this.socket.off('notification', callback);
        }
    }

    getSocket() {
        return this.socket;
    }
}

export default new SocketService();
