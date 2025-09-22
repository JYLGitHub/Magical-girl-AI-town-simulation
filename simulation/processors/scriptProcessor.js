// simulation/processors/scriptProcessor.js

async function processScriptAction(action, world) {
    const { characterDatabase } = world;
    const character = characterDatabase[action.charId];
    
    if (!character) {
        console.warn(`캐릭터를 찾을 수 없음: ${action.charId}`);
        return { success: false, error: 'Character not found' };
        
    }
    // 대화 중이 아닐 때만 currentAction을 업데이트하도록 조건 추가
    if (!character.conversationId) {
        character.currentAction = action.content;
    }
    // 스크립트 액션 처리
    if (action.location) character.location = action.location;
    if (action.status) character.status = action.status;
    
    character.currentAction = action.content || '';
    character.actionType = 'script';
    
    let description = action.content || '';
    
    // 위치 이동이 있는 경우 설명에 추가
    if (action.targetLocation && action.targetLocation !== character.location) {
        character.location = action.targetLocation;
        description += ` (${action.targetLocation}으로 이동)`;
    }
    
    return {
        success: true,
        actionLog: { 
            charId: character.id, 
            description: description 
        }
    };
}

module.exports = { processScriptAction };