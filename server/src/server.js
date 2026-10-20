// ============================================================
// Express + Socket.io Server
// ============================================================
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { setupSocket } from './socketHandler.js';
import { getLanIP } from './network.js';
import { getAdminKey } from './hostAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

setupSocket(io);

// -------- API Routes --------

// LAN info + QR code for the mobile scoring page
app.get('/api/lan-info', async (req, res) => {
    try {
        const ip = getLanIP();
        const url = `http://${ip}:${PORT}`;
        const mobileUrl = `${url}/mobile`;

        const qrCode = await QRCode.toDataURL(mobileUrl, {
            width: 300,
            margin: 2,
            color: { dark: '#ffffff', light: '#00000000' },
        });

        res.json({ ip, port: PORT, url, mobileUrl, qrCode });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// -------- Serve Frontend --------
// Prefer a fresh client build (repo checkout), fall back to the bundled
// copy in server/public (portable release).
const clientBuildPath = [
    path.join(__dirname, '../../client/dist'),
    path.join(__dirname, '../public'),
].find((p) => fs.existsSync(path.join(p, 'index.html')));

if (clientBuildPath) {
    app.use(express.static(clientBuildPath));
    // SPA fallback: all non-API routes serve index.html
    app.get(/^(?!\/api\/|\/socket\.io\/).*/, (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.status(200).send(
            '<h1>Client not built yet</h1><p>Run <code>npm run build</code> in the project folder, then restart the server.</p>'
        );
    });
}

// -------- Start Server --------

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use.`);
        console.error('   Is the server already running in another window? Otherwise start it on another port, e.g.:');
        console.error(`   PORT=3001 npm start   (Windows: set PORT=3001 && npm start)\n`);
        process.exit(1);
    }
    throw err;
});

server.listen(PORT, '0.0.0.0', () => {
    const ip = getLanIP();
    console.log('');
    console.log('🎯 ═══════════════════════════════════════════');
    console.log('   DART TOURNAMENT SERVER');
    console.log('═══════════════════════════════════════════════');
    console.log(`   Host (this PC):        http://localhost:${PORT}`);
    console.log(`   Phones (scoring):      http://${ip}:${PORT}/mobile`);
    console.log(`   Admin on other device: http://${ip}:${PORT}/?admin=${getAdminKey()}`);
    console.log('═══════════════════════════════════════════════');
    if (!clientBuildPath) {
        console.log('   ⚠️  Client not built yet - run "npm run build" first.');
    }
    console.log('   Keep this window open! Stop with Ctrl+C.');
    console.log('');
});

export { app, server, io };
