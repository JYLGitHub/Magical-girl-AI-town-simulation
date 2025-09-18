// 📍 engine.js 시간만 흐르게 하고 모든 캐릭터에게 "이제 뭐 할지 생각하세요!" 라고 지시만 내리는 '심장' 역할
// "캐릭터들이 이런 행동들을 하려고 합니다" 라는 계획서 묶음을 inputHandler.js에게 전달하는 역할

const { think } = require('./ai.js');
const { processActions } = require('./inputHandler.js');
const { updateCharacterStats } = require('./status.js');
const { loadWorld, saveWorld, initializeWorld } = require('./database.js');

// [추가] World 클래스를 새로 만듭니다. 시뮬레이션의 모든 것을 관리합니다.
class World {
    constructor() {
        // 서버가 시작될 때 database.js를 통해 저장된 파일이 있으면 불러오고, 없으면 새로 시작합니다.
        const worldData = loadWorld() || initializeWorld();
        this.characterDatabase = worldData.characterDatabase;
        this.situation = worldData.situation;
        this.activeConversations = worldData.activeConversations;
        this.messageQueue = worldData.messageQueue;
        this.llmConfigs = worldData.llmConfigs || {};
    }

    // 월드 데이터를 파일에 저장하는 기능입니다.
    save() {
        const worldData = {
            characterDatabase: this.characterDatabase,
            situation: this.situation,
            activeConversations: this.activeConversations,
            messageQueue: this.messageQueue,
            llmConfigs: this.llmConfigs,
        };
        saveWorld(worldData);
    }

    // 이제 this를 사용해 자기 자신의 데이터에 접근합니다.
    async nextTurn() {
        // 1. AI 두뇌(ai.js)를 통해 모든 캐릭터의 행동 계획을 수집합니다.
        const agentActions = [];
        for (const character of Object.values(this.characterDatabase)) {
            // 이제 '생각'은 ai.js의 think 함수가 전담합니다.
            const action = await think(character, this);
            agentActions.push({ ...action, charId: character.id });
        }
        console.log("\n--- [1단계: 모든 캐릭터 액션 생성 완료] ---");
        agentActions.forEach(action => {
            const charName = this.characterDatabase[action.charId]?.name || '???';
            console.log(`  - ${charName}: ${action.actionName} - "${(action.content || '').substring(0, 50)}..."`);
        });

        // 2. 수집된 행동 계획서를 행동 처리기(inputHandler.js)에 넘겨 세상을 변화시킵니다.
        console.log("\n--- [2단계: 액션 일괄 처리 시작] ---");
        await processActions(agentActions, this);
    }
}

module.exports = { World };