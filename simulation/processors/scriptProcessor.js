// simulation/processors/scriptProcessor.js

function processScriptedAction(action, world) {
    const { characterDatabase } = world;
    const character = characterDatabase[action.charId];

    if (!character) {
        console.warn(`캐릭터를 찾을 수 없음: ${action.charId}`);
        return { success: false, error: 'Character not found' };
    }

    // 대화 중이 아닐 때만 currentAction을 업데이트하도록 수정
    if (!character.conversationId) {
        character.currentAction = action.content || '';
        character.actionType = 'script';
    }

    // 스크립트 액션의 다른 효과 처리 (예: 위치 이동)
    if (action.location) character.location = action.location;
    if (action.status) character.status = action.status;

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

// 이 파일에서 export하는 함수 이름도 통일해줍니다.
module.exports = { processScriptedAction };