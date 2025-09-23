// 📍 routes.js

const express = require('express');
const router = express.Router();

// [수정] 이제 setupRoutes 함수는 world 객체 하나만 받습니다.
function setupRoutes(world) {
    
    // [수정] '/api/get-initial-data'는 이제 필요 없으므로 삭제합니다.
    // 이 역할은 아래에 만들 '/api/get-world-state'가 대신합니다.
    
    // [추가] 클라이언트가 월드의 현재 상태 전체를 요청하는 유일한 API
    router.get('/api/get-world-state', (req, res) => {
        // world 객체 전체를 JSON 형태로 응답합니다.
        // 클라이언트에게 필요한 모든 정보가 여기에 담겨 있습니다.
        res.json({
            characters: world.characterDatabase,
            situation: world.situation,
            activeConversations: world.activeConversations,
            // mainEvents 같은 추가적인 정보가 있다면 함께 보낼 수 있습니다.
        });
    });
        // LLM 설정 업데이트 API 추가
    router.post('/api/update-llm-config', (req, res) => {
        const { characterId, provider } = req.body;
        
        if (!world.llmConfigs) {
            world.llmConfigs = {};
        }
        
        world.llmConfigs[characterId] = { provider };
        
        console.log(`[LLM 설정 업데이트] ${characterId}: ${provider}`);
        res.json({ success: true });
    });
    return router;
}



module.exports = setupRoutes;