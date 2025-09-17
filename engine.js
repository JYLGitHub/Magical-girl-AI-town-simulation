// 📍 engine.js (수정 버전)

const { processActions } = require('./inputHandler.js');
const { runAgent } = require('./simulation.js');
const { updateCharacterStats } = require('./status.js');
const { createMemoryFromConversation } = require('./memory.js');
const { createPlanFromConversation } = require('./planning.js');
const { updateRelationshipFromConversation } = require('./relationships.js');


async function runEngineStep(worldState) {
    const previousConversations = worldState.activeConversations.map(c => ({...c}));

    const agentActions = [];
    for (const character of Object.values(worldState.characterDatabase)) {
        const action = await runAgent(character, worldState);
        agentActions.push({ ...action, charId: character.id });
    }
    console.log("\n--- [1단계: 모든 캐릭터 액션 생성 완료] ---");
    agentActions.forEach(action => {
        const charName = worldState.characterDatabase[action.charId]?.name || '???';
        console.log(`  - ${charName}: ${action.actionName} - "${(action.content || '').substring(0, 50)}..."`);
    });

    console.log("\n--- [2단계: 액션 일괄 처리 시작] ---");
    const { actionLogs } = processActions(agentActions, worldState);

    console.log("\n--- [3단계: 캐릭터 스탯 업데이트] ---");
    for (const character of Object.values(worldState.characterDatabase)) {
        const plan = agentActions.find(p => p.charId === character.id);
        updateCharacterStats(character, plan);
    }

    console.log("\n--- [4단계: 종료된 대화 처리] ---");
    const endedConversations = previousConversations.filter(
        prevConv => prevConv.isActive && !worldState.activeConversations.some(newConv => newConv.id === prevConv.id)
    );

    for (const endedConv of endedConversations) {
        console.log(`  - 대화(${endedConv.id})가 종료되어 기억과 약속을 처리합니다.`);
        const firstId = (endedConv.participantHistory && endedConv.participantHistory[0]) || (endedConv.participants && endedConv.participants[0]);
        const provider = (firstId && worldState.llmConfigs[firstId]?.provider) || 'gemini';


        const newPlan = await createPlanFromConversation(endedConv, worldState.characterDatabase, provider, worldState.situation);
        if (newPlan && newPlan.participants) {
            console.log(`  [약속 기록!] ${newPlan.day}일차 ${newPlan.hour}:${newPlan.minute} ${newPlan.location}에서 "${newPlan.activity}"`);
            const planMemory = {
                timestamp: new Date().toISOString(), // 약속 시간을 미래로 설정해야 함
                description: `${newPlan.day}일 ${newPlan.hour}:${newPlan.minute}에 ${newPlan.location}에서 '${newPlan.activity}' 약속. (참여자: ${newPlan.participants.join(', ')})`,
                poignancy: newPlan.poignancy,
                type: 'plan',
            };
            newPlan.participants.forEach(name => {
                const char = Object.values(worldState.characterDatabase).find(c => c.name === name);
                if (char) char.journal.push(planMemory);
            });
        }

        for (const participantId of endedConv.participantHistory) {
            const character = worldState.characterDatabase[participantId];
            if (character) {
                const newMemory = await createMemoryFromConversation(character, endedConv, worldState.characterDatabase, provider);
                if (newMemory) {
                    character.journal.push(newMemory);
                    // ⭐ 중요도(poignancy)를 함께 로그에 출력하도록 수정!
                    console.log(`    - ${character.name}의 기억 생성: "${newMemory.description}" (중요도: ${newMemory.poignancy})`);
                }
            }
            // — 관계 업데이트 (양방향) —
            const ids = endedConv.participants || endedConv.participantHistory || [];
            for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                const a = worldState.characterDatabase[ids[i]];
                const b = worldState.characterDatabase[ids[j]];
                if (!a || !b) continue;

                const deltaAB = await updateRelationshipFromConversation(a, b, endedConv, worldState.characterDatabase, provider);
                const deltaBA = await updateRelationshipFromConversation(b, a, endedConv, worldState.characterDatabase, provider);

                if (deltaAB) {
                a.relationships[b.name] = a.relationships[b.name] || { affection: 50, trust: 50 };
                a.relationships[b.name].affection += deltaAB.affectionChange;
                a.relationships[b.name].trust     += deltaAB.trustChange;
                console.log(`    - 관계 변화 ${a.name}→${b.name}: ❤️ ${deltaAB.affectionChange}, 🤝 ${deltaAB.trustChange}`);
                }
                if (deltaBA) {
                b.relationships[a.name] = b.relationships[a.name] || { affection: 50, trust: 50 };
                b.relationships[a.name].affection += deltaBA.affectionChange;
                b.relationships[a.name].trust     += deltaBA.trustChange;
                console.log(`    - 관계 변화 ${b.name}→${a.name}: ❤️ ${deltaBA.affectionChange}, 🤝 ${deltaBA.trustChange}`);
                }
            }
        }

        }
    }

    // --- ⭐ 5단계: 최종 결과 출력 (로직 개선) ---
    const { day, currentHour, currentMinute } = worldState.situation;
    const dayOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][(day) % 7];
    console.log(`\n--- [${day}일차 (${dayOfWeek}) ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}] ---`);

    for (const character of Object.values(worldState.characterDatabase)) {
        let displayText = '';
        const log = actionLogs.find(l => l.charId === character.id);

        if (log) {
            displayText = log.description;
        } else if (character.conversationId) {
            // ⭐ 대화 중인데 별도 로그가 없다면 '듣는 중'으로 표시
            const currentConv = worldState.activeConversations.find(c => c.id === character.conversationId);
            if(currentConv) {
                 displayText = `${currentConv.participants.map(pId => worldState.characterDatabase[pId]?.name).join(', ')}의 대화를 듣고 있습니다.`;
            }
        } else {
            // ⭐ 대화 중이 아닐 때만 스크립트 행동 표시
            const scriptAction = agentActions.find(a => a.charId === character.id && a.actionName === 'script');
            if (scriptAction && scriptAction.content) {
                displayText = scriptAction.content;
            } else {
                displayText = '대기 중...';
            }
        }
        console.log(`  - [${character.location}] ${character.name}: ${displayText}`);
    }
}

module.exports = { runEngineStep };