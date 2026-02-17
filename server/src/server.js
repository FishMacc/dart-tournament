// ============================================================
// Express + Socket.io Server
// ============================================================
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import QRCode from 'qrcode';
import { setupSocket } from './socketHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// CORS for local development
app.use(cors());
app.use(express.json());

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

setupSocket(io);

// -------- Utility: Get LAN IP --------

function getLanIP() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// -------- API Routes --------

// Get LAN info + QR Code
app.get('/api/lan-info', async (req, res) => {
    try {
        const ip = getLanIP();
        const url = `http://${ip}:${PORT}/mobile`;

        // Generate QR code for the mobile URL
        const qrDataUrl = await QRCode.toDataURL(url, {
            width: 300,
            margin: 2,
            color: { dark: '#ffffff', light: '#00000000' },
        });

        res.json({ ip, port: PORT, url: `http://${ip}:${PORT}`, mobileUrl: url, qrCode: qrDataUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// -------- Serve Frontend --------
import fs from 'fs';
// Check for local 'public' folder (production/packaged) first, then dev path
const localPublicPath = path.join(__dirname, '../public');
const devClientPath = path.join(__dirname, '../../client/dist');
const clientBuildPath = fs.existsSync(localPublicPath) ? localPublicPath : devClientPath;

if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    // SPA fallback: all non-API routes serve index.html
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
} else {
    app.get('*', (req, res) => {
        res.status(200).send(
            '<h1>Client not built yet</h1><p>Run <code>npm run build</code> in the client directory, then restart the server.</p>'
        );
    });
}

// -------- Start Server --------

server.listen(PORT, '0.0.0.0', () => {
    const ip = getLanIP();
    console.log('');
    console.log('🎯 ═══════════════════════════════════════════');
    console.log('   DART TOURNAMENT SERVER');
    console.log('═══════════════════════════════════════════════');
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   LAN:     http://${ip}:${PORT}`);
    console.log('═══════════════════════════════════════════════');
    console.log('');
});

export { app, server, io };
