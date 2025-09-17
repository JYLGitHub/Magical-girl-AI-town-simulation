// =======================================================================
// 데이터 구조의 '설계도' 및 '생성자' 역할을 하는 파일입니다.
// =======================================================================

/**
 * 새로운 캐릭터 객체를 생성합니다.
 * @param {object} initialData - 캐릭터 생성을 위한 초기 데이터 (id, name, role 등)
 * @returns {object} - 기본값이 모두 설정된 완전한 캐릭터 객체
 */
function createCharacter(initialData) {
    return {
        id: initialData.id,
        name: initialData.name,
        role: initialData.role || '주민',
        avatar: initialData.avatar || '🧑',
        personality: initialData.personality || '평범한 성격',
        archetype: initialData.archetype || 'officeWorker',
        
        // 상태 정보
        location: '집',
        status: '휴식',
        currentAction: '대기 중...',
        thoughts: '...',
        conversationId: null,

        // 스탯 정보
        mood: '평온',
        energy: 100,
        stress: 10,
        socialNeed: 50,
        
        // 장기 정보
        journal: [],
        relationships: {},
        shortTermGoal: null,
        dailyPlan: [], // ⭐ AI가 생성한 하루 계획(문장)을 저장할 공간

    };
}

/**
 * 새로운 대화 객체를 생성합니다.
 * @param {string} convId - 새로운 대화 ID
 * @param {string} initiatorId - 대화를 시작한 캐릭터의 ID
 * @param {string} targetId - 대화 상대의 ID
 * @param {string} initialMessage - 첫 번째 대화 내용
 * @returns {object} - 완전한 대화 객체
 */
function createConversation(convId, initiatorId, targetId, initialMessage) {
    return {
        id: convId,
        participants: [initiatorId, targetId],
        log: [{ speaker: initiatorId, content: initialMessage }],
        turnHolder: targetId, // 첫 턴은 상대방에게
    };
}


module.exports = {
    createCharacter,
    createConversation,
};