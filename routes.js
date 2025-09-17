// 📍 routes.js (최종 완성본)

const express = require('express');
const router = express.Router();


function setupRoutes(world, saveWorld) { // saveDatabase 대신 saveWorld를 받습니다.
    
        // 클라이언트가 처음 접속했을 때 초기 데이터를 받아가는 API만 남겨둡니다.
    router.get('/api/get-initial-data', (req, res) => {
        res.json({ 
            characters: world.characterDatabase,
            situation: world.situation 
        });
    });
    
    return router;
}

module.exports = setupRoutes;