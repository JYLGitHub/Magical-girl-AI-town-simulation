// 📍 server.js (최종 완성본)

require('dotenv').config();
require('./utils/logger.js');
const express = require('express');
const cors = require('cors');
const { World } = require('./core/engine.js');
const setupRoutes = require('./routes.js');

const world = new World();

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

const apiRouter = setupRoutes(world);
app.use(apiRouter);

let simulationRunning = false;
let simulationInterval = null;

// 시뮬레이션 시작 API
app.post('/api/start-simulation', (req, res) => {
    if (!simulationRunning) {
        simulationRunning = true;
        simulationInterval = setInterval(async () => {
        // console.log('--- [서버 자동 턴 진행] ---');
            
            // 1단계: 시간 증가
            updateWorldTime();
            
            // 2단계: 턴 실행 (순차 처리)
            await runWorldStep();
            
            // 3단계: 저장
            world.save();
        }, 5000); // 5초마다
        
    console.log('▶ 시뮬레이션 시작됨');
    }
    res.json({ success: true, running: simulationRunning });
});

function updateWorldTime() {
    world.situation.currentMinute += 30;
    if (world.situation.currentMinute >= 60) {
        world.situation.currentMinute = 0;
        world.situation.currentHour++;
        if (world.situation.currentHour >= 24) {
            world.situation.currentHour = 0;
            world.situation.day++;
        }
    }
}

async function runWorldStep() {
    // AI Town 방식: 순차 실행
    // 1. 모든 캐릭터 액션 생성
    const actions = await world.getAllCharacterActions();
    
    // 2. 액션 처리 완료까지 대기
    await world.processAllActions(actions);
}

// 시뮬레이션 정지 API
app.post('/api/stop-simulation', (req, res) => {
    if (simulationRunning) {
        clearInterval(simulationInterval);
        simulationRunning = false;
        console.log('⚠ 시뮬레이션 정지됨');
    }
    res.json({ success: true, running: simulationRunning });
});

// ⭐ 추가할 API 엔드포인트들
app.get('/api/get-world-state', (req, res) => {
    const characterToCheck = world.characterDatabase['char1']; // 확인하고 싶은 캐릭터 ID
    if (characterToCheck) {
        console.log(`[액션 추적] 3. API 전송 직전: ${characterToCheck.name}의 currentAction -> "${characterToCheck.currentAction}"`);
    }
    res.json({
        characters: world.characterDatabase,
        situation: world.situation,
        conversations: world.activeConversations,  // ⭐ 추가
        mainEvents: []
    });
});

app.post('/api/reset-simulation', (req, res) => {
    console.log('🔄 시뮬레이션 데이터 리셋 요청 수신');
    // [수정] world를 새로 생성하고, 기존 world의 속성을 새 객체로 덮어씁니다.
    // 이렇게 하면 참조가 유지되어 서버 재시작 없이 리셋이 가능합니다.
    const newWorld = new World();
    Object.keys(newWorld).forEach(key => {
        world[key] = newWorld[key];
    });
    console.log('✅ 시뮬레이션 데이터가 성공적으로 초기화되었습니다.');
    res.json({ success: true, message: '시뮬레이션이 초기화되었습니다.' });
});

app.listen(PORT, () => {
    console.log(`🚀 Simulation server running on http://localhost:${PORT}`);
});