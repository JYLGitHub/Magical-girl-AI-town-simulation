// core/engine.js
const { runAgent } = require('../agent/think.js');
const { processActions } = require('../simulation/inputHandler.js');
const { updateCharacterStats } = require('../simulation/status.js');
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

    async nextTurn() {
        const agentActions = [];
        for (const character of Object.values(this.characterDatabase)) {
            const action = await runAgent(character, this);
            agentActions.push({ ...action, charId: character.id });
        }
        
        console.log("\n--- [1단계: 모든 캐릭터 액션 생성 완료] ---");
        await processActions(agentActions, this);
    }
}

module.exports = { World };