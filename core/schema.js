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
        location: initialData.location || '집', // ⭐ 이렇게 수정
        homeLocation: initialData.homeLocation || initialData.location || '집', // ⭐ 추가
        status: '휴식',
        currentAction: '대기 중...',
        thoughts: '...',
        conversationId: null,

        // 스탯 정보 - AI가 직접 정의
        mood: '평온',
        statusDescription: '특별한 감정 없이 평범한 상태',
        energy: 100,
        stress: 10,
        socialNeed: 50,
        
        // 확장된 관계 정보
        relationships: {},

        // 장기 정보
        journal: [],
        shortTermGoal: null,
        dailyPlan: [], // ⭐ AI가 생성한 하루 계획(문장)을 저장할 공간
        currentPlan: null,        // 현재 실행 중인 계획
        planEndTime: null,        // 계획 종료 시간
        lastPlanTime: 0,          // 마지막으로 계획을 세운 시간
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

function createRelationship(characterAName, characterBName) {
    return {
        // 기본 수치 (0-100)
        affection: 50,          
        trust: 50,              
        respect: 50,            
        familiarity: 10,        
        dependency: 0,          
        rivalry: 0,             
        
        // AI가 직접 정의하는 관계 설명
        relationshipType: "처음 만난 사람",
        relationshipSummary: "아직 서로에 대해 잘 모르는 상태",
        
        // 감정적 영향 (-10 ~ +10)
        energyModifier: 0,      
        stressModifier: 0,      
        moodInfluence: "중립",   
        
        // 상호작용 기록
        interactionCount: 0,
        lastInteraction: null,
        conversationCount: 0,
        sharedExperiences: [],
        
        // 시간 정보
        firstMet: null,
        relationshipDuration: 0,
        
        // 특별한 이벤트들
        significantEvents: [],   
        conflicts: [],           
        positiveMemories: [],    
    };
}

module.exports = {
    createCharacter,
    createConversation,
    createRelationship,
};