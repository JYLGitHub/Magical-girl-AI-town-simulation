// 📍 server.js (최종 완성본)

require('dotenv').config();
require('./logger.js');
const express = require('express');
const cors = require('cors');
const { World } = require('./engine.js');
const setupRoutes = require('./routes.js');

const world = new World();

setInterval(async () => {
    console.log('--- [서버 자동 턴 진행] ---');
    // 30분씩 시간을 흐르게 합니다.
    world.situation.currentMinute += 30;
    if (world.situation.currentMinute >= 60) {
        world.situation.currentMinute = 0;
        world.situation.currentHour++;
        if (world.situation.currentHour >= 24) {
            world.situation.currentHour = 0;
            world.situation.day++;
        }
    }
    
    await world.nextTurn();
    world.save(); // 매 턴마다 월드 상태를 저장합니다.
}, 5000); // 5000ms = 5초

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

const apiRouter = setupRoutes(world);
app.use(apiRouter);

app.get('/api/get-world-state', (req, res) => {
    // 월드의 모든 데이터를 JSON 형태로 응답합니다.
    res.json({
        characters: world.characterDatabase,
        situation: world.situation,
        mainEvents: world.mainEvents || [], // mainEvents가 없을 경우를 대비
        llmConfigs: world.llmConfigs
    });
});

app.post('/api/reset-simulation', (req, res) => {
    console.log('🔄 시뮬레이션 데이터 리셋 요청 수신');
    Object.assign(world, new World()); // 기존 world 객체를 새 world로 덮어씁니다.
    console.log('✅ 시뮬레이션 데이터가 성공적으로 초기화되었습니다.');
    res.json({ success: true, message: '시뮬레이션이 초기화되었습니다.' });
});

app.listen(PORT, () => {
    console.log(`🚀 Simulation server running on http://localhost:${PORT}`);
});