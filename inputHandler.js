// 📍 inputHandler.js (수정 완료된 최종본)

const { createConversation, addMessageToConversation, endConversation } = require('./conversation.js');
const { createMemoryFromConversation } = require('./memory.js');
const { createPlanFromConversation } = require('./planning.js');
const { updateRelationshipFromConversation } = require('./relationships.js');

// [수정] 이제 agentActions도 인자로 함께 받습니다.
async function processActions(actions, world) {
    console.log("\n--- [2.5단계: 핸들러가 받은 계획서] ---");
    console.log(actions);
    // [수정] worldState 대신 world에서 필요한 모든 데이터를 가져옵니다.
    const { characterDatabase, activeConversations, llmConfigs, situation } = world;
    const actionLogs = [];
    // [수정] world.activeConversations를 사용합니다.
    const previousConversations = world.activeConversations.map(c => ({...c}));

    console.log("\n--- [2단계: 액션 일괄 처리 시작] ---");

    // --- 1 & 2. 대화 시작 및 그룹 처리 (기존 로직 유지, worldState -> world 수정) ---
    const conversationStarters = actions.filter(a => a.actionName === 'startConversation' && a.target && a.target.length > 0);
    const conversationGroups = new Map();

    for (const starter of conversationStarters) {
        const initiator = characterDatabase[starter.charId];
        if (initiator.conversationId) continue;

        const targets = starter.target
            .map(name => Object.values(characterDatabase).find(c => c.name === name && c.location === initiator.location && !c.conversationId))
            .filter(Boolean);

        if (targets.length === 0) continue;

        const allParticipants = [initiator, ...targets].map(c => c.id).sort();
        const groupKey = allParticipants.join('-');

        if (!conversationGroups.has(groupKey)) {
            conversationGroups.set(groupKey, {
                participantIds: new Set(allParticipants),
                starters: [],
            });
        }
        conversationGroups.get(groupKey).starters.push(starter);
    }

    for (const [groupKey, group] of conversationGroups.entries()) {
        const participantIds = Array.from(group.participantIds);
        if (participantIds.some(id => characterDatabase[id].conversationId)) continue;
        if (participantIds.length < 2) continue;
        const firstSpeakerAction = group.starters[0];
        const firstSpeakerId = firstSpeakerAction.charId;
        
        // [수정] worldState 대신 world를 넘겨줍니다.
        const newConv = createConversation(participantIds, world, firstSpeakerId);
        activeConversations.push(newConv);

        participantIds.forEach(pId => {
            characterDatabase[pId].conversationId = newConv.id;
        });

        const nextSpeakerId = participantIds.find(id => id !== firstSpeakerId) || firstSpeakerId;
        addMessageToConversation(newConv, firstSpeakerId, firstSpeakerAction.content, nextSpeakerId);
        const targetNames = firstSpeakerAction.target.join(', ');
        actionLogs.push({ charId: firstSpeakerId, description: `${targetNames}에게 대화 시작: "${firstSpeakerAction.content}"` });
    }

    // --- 3. 개별 액션 처리 (기존 로직 유지) ---
    for (const action of actions) {
        const character = characterDatabase[action.charId];
        if (!character || action.actionName === 'startConversation') continue;

        let description = '';
        const conv = activeConversations.find(c => c.id === character.conversationId);

        if (character.conversationId) {
            const conv = activeConversations.find(c => c.id === character.conversationId);
            if (!conv || !conv.isActive) continue;

            if (action.actionName === 'continueConversation' && conv.turnHolder === character.id) {
                const nextSpeaker = Object.values(characterDatabase).find(c => c.name === action.nextSpeaker);
                let nextSpeakerId = null;
                if (nextSpeaker && conv.participants.includes(nextSpeaker.id)) {
                    nextSpeakerId = nextSpeaker.id;
                } else {
                    nextSpeakerId = conv.participants.find(pId => pId !== character.id) || character.id;
                }
                addMessageToConversation(conv, character.id, action.content, nextSpeakerId);
                description = `대화 중: "${action.content}"`;

            } else if (action.actionName === 'leaveConversation') {
                description = `${action.content || '대화를 떠났습니다.'}`;
                character.conversationId = null;
                conv.participants = conv.participants.filter(pId => pId !== character.id);
                if (conv.participants.length >= 2) {
                    conv.turnHolder = conv.participants.find(pId => pId !== character.id);
                    addMessageToConversation(conv, character.id, '(대화를 떠났습니다)', conv.turnHolder);
                }
            }
        } else {
            if (action.actionName === 'script') {
                if (action.location) character.location = action.location;
                if (action.status)   character.status   = action.status;
                character.currentAction = action.content || '';
                character.actionType    = 'script';
                description = action.content || '';
                
            } else if (action.actionName === 'sendMessage' && action.target && action.target.length > 0) {
                const targetName = action.target[0];
                description = `${targetName}에게 메시지를 보냈다: "${action.content}"`;
                if (action.targetLocation) {
                    character.location = action.targetLocation;
                    description += ` (${action.targetLocation}으로 이동)`;
                }
            } else {
                description = action.content;
                if (action.targetLocation) {
                    character.location = action.targetLocation;
                    description += ` (${action.targetLocation}으로 이동)`;
                }
            }
        }
        
        if (description) {
            actionLogs.push({ charId: character.id, description });
        }
    }
    
    // --- 4. 종료된 대화 처리 (engine.js에서 이동해 온 로직) ---
    console.log("\n--- [4단계: 종료된 대화 처리] ---");
    const endedConversations = previousConversations.filter(
        prevConv => prevConv.isActive && !world.activeConversations.some(newConv => newConv.id === prevConv.id)
    );

    for (const endedConv of endedConversations) {
        console.log(`  - 대화(${endedConv.id})가 종료되어 기억과 약속을 처리합니다.`);
        const firstId = (endedConv.participantHistory && endedConv.participantHistory[0]) || (endedConv.participants && endedConv.participants[0]);
        const provider = (firstId && llmConfigs[firstId]?.provider) || 'gemini';
        
        const newPlan = await createPlanFromConversation(endedConv, characterDatabase, provider, situation);
        if (newPlan && newPlan.participants) {
            console.log(`  [약속 기록!] ${newPlan.day}일차 ${newPlan.hour}:${newPlan.minute} ${newPlan.location}에서 "${newPlan.activity}"`);
            const planMemory = {
                timestamp: new Date().toISOString(),
                description: `${newPlan.day}일 ${newPlan.hour}:${newPlan.minute}에 ${newPlan.location}에서 '${newPlan.activity}' 약속. (참여자: ${newPlan.participants.join(', ')})`,
                poignancy: newPlan.poignancy,
                type: 'plan',
            };
            newPlan.participants.forEach(name => {
                const char = Object.values(characterDatabase).find(c => c.name === name);
                if (char) char.journal.push(planMemory);
            });
        }

        for (const participantId of endedConv.participantHistory) {
            const character = characterDatabase[participantId];
            if (character) {
                const newMemory = await createMemoryFromConversation(character, endedConv, characterDatabase, provider);
                if (newMemory) {
                    character.journal.push(newMemory);
                    console.log(`    - ${character.name}의 기억 생성: "${newMemory.description}" (중요도: ${newMemory.poignancy})`);
                }
            }
        }
        
        const ids = endedConv.participantHistory || [];
        for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                const a = characterDatabase[ids[i]];
                const b = characterDatabase[ids[j]];
                if (!a || !b) continue;

                const deltaAB = await updateRelationshipFromConversation(a, b, endedConv, characterDatabase, provider);
                const deltaBA = await updateRelationshipFromConversation(b, a, endedConv, characterDatabase, provider);

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

    // --- 5. 최종 결과 출력 ---
    const { day, currentHour, currentMinute } = world.situation;
    const dayOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][(day) % 7];
    console.log(`\n--- [${day}일차 (${dayOfWeek}) ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}] ---`);

    for (const character of Object.values(world.characterDatabase)) {
        let displayText = '';
        const log = actionLogs.find(l => l.charId === character.id);

        if (log) {
            displayText = log.description;
        } else if (character.conversationId) {
            const currentConv = world.activeConversations.find(c => c.id === character.conversationId);
            if(currentConv) {
                 displayText = `${currentConv.participants.map(pId => world.characterDatabase[pId]?.name).join(', ')}의 대화를 듣고 있습니다.`;
            }
        } else {
            // [수정] agentActions 대신 actions (이 함수의 인자) 를 사용합니다.
            const scriptAction = actions.find(a => a.charId === character.id && a.actionName === 'script');
            if (scriptAction && scriptAction.content) {
                displayText = scriptAction.content;
            } else {
                displayText = '대기 중...';
            }
        }
        console.log(`  - [${character.location}] ${character.name}: ${displayText}`);
    }

    world.activeConversations.forEach(conv => {
        if (conv.isActive && conv.participants.length < 2) {
            endConversation(conv, characterDatabase);
        }
    });
    world.activeConversations = world.activeConversations.filter(c => c.isActive);
}

module.exports = { processActions };