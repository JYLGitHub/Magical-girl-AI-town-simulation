// simulation/processors/movementProcessor.js
const { truncateText } = require('../../utils/logger.js');

async function processMovementAction(action, world) {
    const { characterDatabase } = world;
    const character = characterDatabase[action.charId];
    
    if (!character) {
        console.warn(`캐릭터를 찾을 수 없음: ${action.charId}`);
        return { success: false, error: 'Character not found' };
    }

    let description = '';

    if (action.actionName === 'sendMessage' && action.target && action.target.length > 0) {
        const targetName = action.target[0];
        const truncatedContent = truncateText(action.content);
        description = `${targetName}에게 메시지를 보냈다: "${truncatedContent}"`;
        
        if (action.targetLocation) {
            character.location = action.targetLocation;
            description += ` (${action.targetLocation}으로 이동)`;
        }
    } else if (action.actionName === 'changeLocation') {
        if (action.targetLocation) {
            character.location = action.targetLocation;
            description = action.content + ` (${action.targetLocation}으로 이동)`;
        } else {
            description = action.content;
        }
    } else {
        description = action.content;
        if (action.targetLocation) {
            character.location = action.targetLocation;
            description += ` (${action.targetLocation}으로 이동)`;
        }
    }
    character.actionType = action.actionType || 'script';
    return {
        success: true,
        actionLog: { 
            charId: character.id, 
            description: description,
            actionType: action.actionType || 'script'
        }
    };
}

module.exports = { processMovementAction };