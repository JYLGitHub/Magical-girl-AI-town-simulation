// simulation/processors/conversationProcessor.js
const { createConversation, addMessageToConversation } = require('../../agent/conversation.js');
const { truncateText } = require('../../utils/logger.js');

async function processConversationAction(action, world) {
    const { characterDatabase } = world;
    const character = characterDatabase[action.charId];
    
    if (!character) {
        console.warn(`캐릭터를 찾을 수 없음: ${action.charId}`);
        return { success: false, error: 'Character not found' };
    }

    switch (action.actionName) {
        case 'startConversation':
            return await handleStartConversation(action, world);
        
        case 'continueConversation':
            return await handleContinueConversation(action, world);
        
        case 'leaveConversation':
            return await handleLeaveConversation(action, world);
        
        case 'listen':
            return handleListen(action, world);
        
        default:
            return { success: false, error: `Unknown conversation action: ${action.actionName}` };
    }
}

async function handleStartConversation(action, world) {
    const { characterDatabase, activeConversations } = world;
    const initiator = characterDatabase[action.charId];
    
    if (initiator.conversationId || !action.target || action.target.length === 0) {
        return { success: false, reason: 'Invalid conversation start conditions' };
    }

    const targets = action.target
        .map(name => Object.values(characterDatabase).find(c => 
            c.name === name && c.location === initiator.location && !c.conversationId))
        .filter(Boolean);

    if (targets.length === 0) {
        return { success: false, reason: 'No valid targets found' };
    }

    // 새 대화 생성
    const participantIds = [initiator.id, ...targets.map(t => t.id)];
    const newConv = createConversation(participantIds, world, initiator.id);
    activeConversations.push(newConv);

    // 참여자들에게 대화 ID 할당
    participantIds.forEach(pId => {
        characterDatabase[pId].conversationId = newConv.id;
    });

    // 첫 메시지 추가
    const nextSpeakerId = participantIds.find(id => id !== initiator.id) || initiator.id;
    addMessageToConversation(newConv, initiator.id, action.content, nextSpeakerId);
    
    const truncatedContent = truncateText(action.content);
    const targetNames = action.target.join(', ');
    
    return {
        success: true,
        actionLog: { 
            charId: initiator.id, 
            description: `${targetNames}과(와) 대화 시작: "${truncatedContent}"` 
        }
    };
}

async function handleContinueConversation(action, world) {
    const { characterDatabase, activeConversations } = world;
    const character = characterDatabase[action.charId];
    const conv = activeConversations.find(c => c.id === character.conversationId);

    if (!conv || !conv.isActive || conv.turnHolder !== character.id) {
        return { success: false, reason: 'Cannot continue conversation' };
    }

    const nextSpeaker = Object.values(characterDatabase).find(c => c.name === action.nextSpeaker);
    let nextSpeakerId = null;
    
    if (nextSpeaker && conv.participants.includes(nextSpeaker.id)) {
        nextSpeakerId = nextSpeaker.id;
    } else {
        nextSpeakerId = conv.participants.find(pId => pId !== character.id) || character.id;
    }
    
    addMessageToConversation(conv, character.id, action.content, nextSpeakerId);
    const truncatedContent = truncateText(action.content);
    
    return {
        success: true,
        actionLog: { 
            charId: character.id, 
            description: `대화 중: "${truncatedContent}"` 
        }
    };
}

async function handleLeaveConversation(action, world) {
    const { characterDatabase, activeConversations } = world;
    const character = characterDatabase[action.charId];
    const conv = activeConversations.find(c => c.id === character.conversationId);

    if (!conv) {
        return { success: false, reason: 'Not in conversation' };
    }

    character.conversationId = null;
    conv.participants = conv.participants.filter(pId => pId !== character.id);
    
    if (conv.participants.length >= 2) {
        conv.turnHolder = conv.participants.find(pId => pId !== character.id);
        addMessageToConversation(conv, character.id, '(대화를 떠났습니다)', conv.turnHolder);
    } else {
        conv.isActive = false;
        // 남은 참여자들의 conversationId도 정리
        conv.participants.forEach(pId => {
            const remainingChar = characterDatabase[pId];
            if (remainingChar) {
                remainingChar.conversationId = null;
            }
        });
    }
    
    return {
        success: true,
        actionLog: { 
            charId: character.id, 
            description: action.content || '대화를 떠났습니다.' 
        }
    };
}

function handleListen(action, world) {
    const { characterDatabase } = world;
    let description = action.content;
    
    // charX를 실제 이름으로 변환만 하면 됨
    description = description.replace(/char(\d+)/g, (match, num) => {
        const charId = `char${num}`;
        return characterDatabase[charId]?.name || match;
    });
    
    return {
        success: true,
        actionLog: { 
            charId: action.charId, 
            description: description
        }
    };
}

module.exports = { processConversationAction };