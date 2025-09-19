// core/engine.js
const { runAgent } = require('../agent/think.js');
const { processActions } = require('../simulation/inputHandler.js');
// const { updateCharacterStats } = require('../simulation/status.js');
const { loadWorld, saveWorld, initializeWorld } = require('./world.js');

class World {
    constructor() {
        const worldData = loadWorld() || initializeWorld();
        this.characterDatabase = worldData.characterDatabase;
        this.situation = worldData.situation;
        this.activeConversations = worldData.activeConversations;
        this.messageQueue = worldData.messageQueue;
        this.llmConfigs = worldData.llmConfigs || {};
    }

    save() {
        const worldData = {
            characterDatabase: this.characterDatabase,
            situation: this.situation,
            activeConversations: this.activeConversations,
            messageQueue: this.messageQueue,
            llmConfigs: this.llmConfigs,
        };
        require('./world.js').saveWorld(worldData);
    }

    async getAllCharacterActions() {
        const actions = [];
        for (const character of Object.values(this.characterDatabase)) {
            const action = await runAgent(character, this);
            actions.push(action);
        }
        return actions;
    }

    async processAllActions(actions) {
        // 기존 processActions 호출하되 완료까지 대기
        return await processActions(actions, this);
    }

    async nextTurn() {
        // AI Town 방식: 더 이상 직접 캐릭터 처리하지 않음
        console.log('Turn completed');
    }
}

module.exports = { World };