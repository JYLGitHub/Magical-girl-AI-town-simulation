// 📍 server.js (최종 완성본)

require('dotenv').config();
require('./logger.js');
const express = require('express');
const cors = require('cors');
const { loadWorld, saveWorld, initializeWorld } = require('./database.js');
const setupRoutes = require('./routes.js');

let world = loadWorld() || initializeWorld();

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

const apiRouter = setupRoutes(world, saveWorld);
app.use(apiRouter);

app.post('/api/reset-simulation', (req, res) => {
    console.log('🔄 시뮬레이션 데이터 리셋 요청 수신');
    world = initializeWorld();
    console.log('✅ 시뮬레이션 데이터가 성공적으로 초기화되었습니다.');
    res.json({ success: true, message: '시뮬레이션이 초기화되었습니다.' });
});

app.listen(PORT, () => {
    console.log(`🚀 Simulation server running on http://localhost:${PORT}`);
});