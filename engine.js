// 📍 engine.js 시간만 흐르게 하고 모든 캐릭터에게 "이제 뭐 할지 생각하세요!" 라고 지시만 내리는 '심장' 역할
// "캐릭터들이 이런 행동들을 하려고 합니다" 라는 계획서 묶음을 inputHandler.js에게 전달하는 역할

const { processActions } = require('./inputHandler.js');
const { think } = require('./ai.js');
const { updateCharacterStats } = require('./status.js');
const { createMemoryFromConversation, retrieveMemories } = require('./memory.js');
const { createPlanFromConversation } = require('./planning.js');
const { updateRelationshipFromConversation } = require('./relationships.js');
const { loadWorld, saveWorld, initializeWorld } = require('./database.js');
const { callLLM } = require('./llm.js');

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

    // --- '성찰' 기능 ---
    async reflectOnMemories(character) {
        const recentMemories = character.journal.slice(-20);
        if (recentMemories.length < 5) return;
        const memoryDescriptions = recentMemories.map(m => `- ${m.description}`).join('\n');
        const prompt = `당신은 '${character.name}'입니다. 다음은 당신의 최근 기억 목록입니다.
        [최근 기억]
        ${memoryDescriptions}
        [임무]
        위 기억들을 바탕으로, 당신 자신이나 다른 사람과의 관계에 대해 얻게 된 중요한 깨달음이나 성찰 2~3가지를 요약하세요.`;

        try {
            const provider = this.llmConfigs[character.id]?.provider || 'gemini';
            const reflectionText = await callLLM(prompt, provider);
            const newMemory = {
                timestamp: new Date().toISOString(),
                description: `(성찰): ${reflectionText}`,
                poignancy: 8,
                type: 'reflection',
            };
            character.journal.push(newMemory);
            console.log(`[성찰 생성] ${character.name}: ${reflectionText}`);
        } catch (error) {
            console.error(`[성찰 생성 오류] ${character.name}:`, error);
        }
    }
    // --- 일일 계획 ---
    async createDailyPlan(character) {
        const situationContext = { nearbyCharacterNames: [] };
        const relevantMemories = retrieveMemories(character, situationContext).slice(0, 5);
        const memoryContext = relevantMemories.map(m => `- ${m.description}`).join('\n');
        const prompt = `당신은 '${character.name}'입니다. 당신의 기본 정보와 최근 성찰은 다음과 같습니다.\n[기본 정보]\n- 역할: ${character.role}\n- 성격: ${character.personality}\n\n[최근 중요 기억/성찰]\n${memoryContext}\n\n[임무]\n위 정보를 바탕으로, 오늘 하루 동안 무엇을 할지에 대한 대략적인 계획을 아침/점심/저녁으로 나누어 한두 문장으로 작성하세요.`;
        try {
            const provider = this.llmConfigs[character.id]?.provider || 'gemini';
            const planText = await callLLM(prompt, provider);
            character.dailyPlan = planText;
            console.log(`[일일 계획 생성] ${character.name}: ${planText}`);
        } catch (error) {
            console.error(`[일일 계획 생성 오류] ${character.name}:`, error);
        }
    }

    // [이동] 기존의 runEngineStep 함수의 모든 내용이 이 안으로 들어왔습니다.
    // 이제 this 대신 'this'를 사용해 자기 자신의 데이터에 접근합니다.
    async nextTurn() {
        // [추가] 매일 자정이 되면 모든 캐릭터가 성찰하고 계획을 세웁니다.
        if (this.situation.currentHour === 0 && this.situation.currentMinute < 30) {
            for (const character of Object.values(this.characterDatabase)) {
                if (character.reflectedOnDay !== this.situation.day) {
                    await this.reflectOnMemories(character);
                    await this.createDailyPlan(character);
                    character.reflectedOnDay = this.situation.day;
                }
            }
        }

        // AI를 통해 모든 캐릭터의 행동 계획 수집
        const agentActions = [];
        for (const character of Object.values(this.characterDatabase)) {
            const action = await think(character, this);
            agentActions.push({ ...action, charId: character.id });
        }
        console.log("\n--- [1단계: 모든 캐릭터 액션 생성 완료] ---");
        agentActions.forEach(action => {
            const charName = this.characterDatabase[action.charId]?.name || '???';
            console.log(`  - ${charName}: ${action.actionName} - "${(action.content || '').substring(0, 50)}..."`);
        });

        console.log("\n--- [2단계: 액션 일괄 처리 시작] ---");
        await processActions(agentActions, this);

        console.log("\n--- [3단계: 캐릭터 스탯 업데이트] ---");
        for (const character of Object.values(this.characterDatabase)) {
            const plan = agentActions.find(p => p.charId === character.id);
            updateCharacterStats(character, plan);
        }
        
    }
}

module.exports = { World };