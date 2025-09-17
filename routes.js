// 📍 routes.js (최종 완성본)

const express = require('express');
const router = express.Router();
const engine = require('./engine.js');

function setupRoutes(world, saveWorld) { // saveDatabase 대신 saveWorld를 받습니다.
    
    router.get('/api/get-initial-data', (req, res) => {
        res.json({ characters: world.characterDatabase });
    });

    router.post('/api/character-update', async (req, res) => {
        try {
            const { situation, llmConfigs } = req.body;
            
            world.situation = situation;
            world.llmConfigs = llmConfigs || {};
            
            // ⭐ [핵심 수정] engine.runEngineStep에 world 객체 하나를 통째로 전달합니다.
            await engine.runEngineStep(world);

            // ⭐ 이제 saveDatabase가 아닌, saveWorld를 사용하여 월드 전체를 저장합니다.
            saveWorld(world);
            
            res.json({ success: true, updates: world.characterDatabase });

        } catch (error) {
            console.error(`[Error in routes.js]`, error);
            res.status(500).json({ error: 'Server error' });
        }
    });
    
    return router;
}

module.exports = setupRoutes;