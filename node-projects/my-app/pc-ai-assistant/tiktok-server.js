const { WebcastPushConnection } = require('tiktok-live-connector');
const { WebSocketServer } = require('ws');

// Configuration
const TIKTOK_USERNAME = 'mickaelmorgado7'; // Change this to the target username
const PORT = 8080;

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT });
console.log(`WebSocket server started on ws://localhost:${PORT}`);

// Create TikTok connection
let tiktokConnection = new WebcastPushConnection(TIKTOK_USERNAME);

// Connect to TikTok
function connectToTikTok(username) {
    tiktokConnection = new WebcastPushConnection(username);
    
    tiktokConnection.connect().then(state => {
        console.info(`Connected to TikTok livestream of ${username}`);
    }).catch(err => {
        console.error('Failed to connect to TikTok', err);
    });

    // Handle TikTok events
    let isReady = false;
    setTimeout(() => {
        isReady = true;
        console.info('TikTok backend is now ignoring backlog and ready for live comments.');
    }, 5000);

    tiktokConnection.on('chat', data => {
        if (!isReady) return;
        console.log(`${data.nickname}: ${data.comment}`);
        broadcast({
            type: 'comment',
            user: data.nickname,
            message: data.comment
        });
    });

    tiktokConnection.on('gift', data => {
        if (!isReady) return;
        console.log(`${data.nickname} sent ${data.giftName}`);
        broadcast({
            type: 'comment',
            user: data.nickname,
            message: `Sent a ${data.giftName}!`
        });
    });

    tiktokConnection.on('error', err => {
        console.error('TikTok Connection Error', err);
    });

    tiktokConnection.on('disconnected', () => {
        console.info('TikTok Connection Disconnected');
    });
}

// Broadcast to all connected WebSocket clients
function broadcast(data) {
    const message = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // 1 = OPEN
            client.send(message);
        }
    });
}

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    console.log('Frontend client connected');
    
    // Send current connection state if needed (optional)
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'set_username') {
                console.log(`Setting TikTok username to: ${data.username}`);
                if (tiktokConnection) {
                    tiktokConnection.disconnect();
                }
                connectToTikTok(data.username);
            }
        } catch (e) {
            console.error('Failed to parse message from client', e);
        }
    });

    ws.on('close', () => {
        console.log('Frontend client disconnected');
    });

    ws.on('error', (err) => {
        console.error('WebSocket client error:', err);
    });
});

// Initial connection
connectToTikTok(TIKTOK_USERNAME);
