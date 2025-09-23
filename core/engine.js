// core/engine.js
const { runAgent } = require('../agent/think.js');
const { processActions } = require('../simulation/inputHandler.js');
const { updateAllCharacterStats } = require('../simulation/status.js');
const { loadWorld, saveWorld, initializeWorld } = require('./world.js');
const { MessageSystem } = require('./messageSystem.js');

class World {
    constructor() {
        const worldData = loadWorld() || initializeWorld();
        this.characterDatabase = worldData.characterDatabase;
        this.situation = worldData.situation;
        this.activeConversations = worldData.activeConversations;
        this.messageQueue = worldData.messageQueue;
        this.llmConfigs = worldData.llmConfigs || {};
        this.messageSystem = new MessageSystem();
    }

    save() {
        const worldData = {
            characterDatabase: this.characterDatabase,
            situation: this.situation,
            activeConversations: this.activeConversations,
            messageQueue: this.messageQueue,
            llmConfigs: this.llmConfigs,
            messageQueue: this.messageSystem.messageQueue, // 추가
        };
        require('./world.js').saveWorld(worldData);
    }

    async getAllCharacterActions() {
        const actions = [];
        // 기존: 동시 처리 (3명이 한번에 LLM 호출)
        // for (const character of Object.values(this.characterDatabase)) {
        //     const action = await runAgent(character, this);
        //     actions.push(action);
        // }

        // 수정: 순차 처리 (1명씩 차례대로)
        const characters = Object.values(this.characterDatabase);
        for (let i = 0; i < characters.length; i++) {
            console.log(`[순차 처리] ${i+1}/${characters.length}: ${characters[i].name} 처리 중...`);
            const action = await runAgent(characters[i], this);
            actions.push(action);
            
            // 각 캐릭터 처리 후 1초 대기 (추가 안전장치)
            if (i < characters.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return actions;
    }

    async processAllActions(actions) {
    // 기존 processActions 호출하되 완료까지 대기
    const result = await processActions(actions, this);
    
    // 메시지 배송 처리
    this.messageSystem.processDeliveries(this);

    // 스탯 업데이트 로직
    updateAllCharacterStats(actions, this);
    
    return result;
}

    async nextTurn() {
        // AI Town 방식: 더 이상 직접 캐릭터 처리하지 않음
        console.log('Turn completed');
    }
}

module.exports = { World };