// 📍 inputHandler.js (최종 수정 버전)

const { createConversation, addMessageToConversation, endConversation } = require('./conversation.js');

function processActions(actions, worldState) {
    const { characterDatabase, activeConversations } = worldState;
    const actionLogs = [];

    // --- 1. 대화 시작 그룹핑 ---
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

    // --- 2. 그룹별로 대화 생성 및 첫 턴 처리 ---
    for (const [groupKey, group] of conversationGroups.entries()) {
        const participantIds = Array.from(group.participantIds);
        if (participantIds.some(id => characterDatabase[id].conversationId)) continue; // 이미 다른 대화 중인 인원 있으면 스킵
        if (participantIds.length < 2) continue; // 2인 미만이면 스킵
        const firstSpeakerAction = group.starters[0];
        const firstSpeakerId = firstSpeakerAction.charId;
        
        const newConv = createConversation(participantIds, worldState, firstSpeakerId);
        activeConversations.push(newConv);

        participantIds.forEach(pId => {
            characterDatabase[pId].conversationId = newConv.id;
        });

        const nextSpeakerId = participantIds.find(id => id !== firstSpeakerId) || firstSpeakerId;
        addMessageToConversation(newConv, firstSpeakerId, firstSpeakerAction.content, nextSpeakerId);
        const targetNames = firstSpeakerAction.target.join(', ');
        actionLogs.push({ charId: firstSpeakerId, description: `${targetNames}에게 대화 시작: "${firstSpeakerAction.content}"` });
    }

    // --- 3. 개별 액션 처리 ---
    for (const action of actions) {
        const character = characterDatabase[action.charId];
        if (!character || action.actionName === 'startConversation') continue;

        let description = '';
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
        } else { // 대화 중이 아닐 때
            if (action.actionName === 'script') {
                if (action.location) character.location = action.location;
                if (action.status)   character.status   = action.status;
                character.currentAction = action.content || '';
                character.actionType    = 'script';
                description = action.content || '';
                
            } else if (action.actionName === 'sendMessage' && action.target && action.target.length > 0) {
                const targetName = action.target[0];
                description = `${targetName}에게 메시지를 보냈다: "${action.content}"`;
                // targetLocation 처리 추가
                if (action.targetLocation) {
                    character.location = action.targetLocation;
                    description += ` (${action.targetLocation}으로 이동)`;
                }
            } else {
                description = action.content;
                // targetLocation 처리 추가
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

    // --- 4. 종료 조건 확인 및 대화방 정리 ---
    activeConversations.forEach(conv => {
        if (conv.isActive && conv.participants.length < 2) {
            endConversation(conv, characterDatabase);
        }
    });

    worldState.activeConversations = activeConversations.filter(c => c.isActive);

    return { actionLogs };
}

module.exports = { processActions };