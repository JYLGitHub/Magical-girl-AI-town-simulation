// 📍 status.js

/**
 * 캐릭터의 행동과 상호작용에 따라 스탯(기분, 에너지 등)을 업데이트합니다.
 * @param {object} character - 업데이트할 캐릭터 객체
 * @param {object} myPlan - 이 캐릭터의 현재 행동 계획
 * @param {object} worldState - 현재 세계의 전체 상태
 */
// ⭐ allPlans를 myPlan으로 변경하여, 계획 1개만 받도록 수정합니다.
function updateCharacterStats(character, myPlan) {
    if (!myPlan) return;

    const actionName = myPlan.actionName || 'script';
    const actionContent = myPlan.content || ''; // content 필드도 확인

    // --- 1. 에너지 변화 ---
    const isSleeping = actionName.includes('sleep') || actionContent.includes('수면') || actionContent.includes('잠');
    const isResting = actionName.includes('relax') || actionName.includes('rest') || actionContent.includes('휴식');
    const isWorking = actionName.includes('work') || actionName.includes('study') || actionContent.includes('공부') || actionContent.includes('근무');

    if (isSleeping) {
        character.energy = Math.min(100, character.energy + 20);
    } else if (isResting) {
        character.energy = Math.min(100, character.energy + 5);
    } else if (isWorking) {
        character.energy = Math.max(0, character.energy - 5);
    } else {
        character.energy = Math.max(0, character.energy - 0.5); // 기본 소모량 소폭 감소
    }


    // --- 2. 사회적 욕구 변화 ---
    if (actionName.includes('Conversation')) { // start, continue, leave 모두 포함
        character.socialNeed = Math.min(100, character.socialNeed + 10);
    } else {
        character.socialNeed = Math.max(0, character.socialNeed - 0.5);
    }


    // --- 3. 스트레스 변화 ---
    if (character.energy < 20) {
        character.stress = Math.min(100, character.stress + 5);
    } else if (isResting) {
        character.stress = Math.max(0, character.stress - 10);
    } else if (character.energy > 80) {
        character.stress = Math.max(0, character.stress - 2); // 에너지가 높으면 스트레스 자연 감소
    } else if (isWorking) {
        character.stress = Math.min(100, character.stress + 1); // 일하면 스트레스 소폭 증가
    }


    // --- 4. 기분 변화 (기존과 동일) ---
    if (character.energy > 80 && character.stress < 30 && character.socialNeed > 50) {
        character.mood = '활기참';
    } else if (character.stress > 70) {
        character.mood = '지침';
    } else if (character.socialNeed < 20) {
        character.mood = '외로움';
    } else {
        character.mood = '평온';
    }
}

module.exports = { updateCharacterStats };