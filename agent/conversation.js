// 📍 conversation.js (수정 버전)

/**
 * 새로운 대화 객체를 생성합니다.
 * @param {Array<string>} participantIds - 참여자 ID 배열
 * @param {object} worldState - 현재 월드 상태
 * @param {string} firstSpeakerId - 첫 발언자 캐릭터의 ID
 * @returns {object} 새 대화 객체
 */
function createConversation(participantIds, worldState, firstSpeakerId) {
    const conversationId = `conv-${Date.now()}-${participantIds.sort().join('-')}`;
    const participantNames = participantIds.map(pId => worldState.characterDatabase[pId]?.name || '???');
    
    console.log(`[대화 생성] ${participantNames.join(', ')}의 대화 시작 (첫 발언자: ${worldState.characterDatabase[firstSpeakerId].name})`);


   return {
        id: conversationId,
        participants: [...participantIds], // 현재 참여자 (떠나면 바뀜)
        participantHistory: [...participantIds], // 모든 참여자 기록 (바뀌지 않음)
        log: [],
        turnHolder: firstSpeakerId,
        isActive: true,
        createdAt: new Date().toISOString(),
    };
}

/**
 * 대화에 메시지를 추가하고 다음 발언자를 지정합니다.
 * @param {object} conversation - 수정할 대화 객체
 * @param {string} speakerId - 발언자 캐릭터의 ID
 * @param {string} content - 발언 내용
 * @param {string} nextSpeakerId - 다음 발언자 캐릭터의 ID
 */
function addMessageToConversation(conversation, speakerId, content, nextSpeakerId) {
    conversation.log.push({ speaker: speakerId, content: content });
    conversation.turnHolder = nextSpeakerId;
}

/**
 * 대화를 비활성화하고 참여자들의 상태를 업데이트합니다.
 * @param {object} conversation - 종료할 대화 객체
 * @param {object} characterDatabase - 전체 캐릭터 데이터베이스
 * @param {object} world - 전체 월드 객체 (기억 생성을 위해 추가)
 */
function endConversation(conversation, characterDatabase) {
    if (!conversation.isActive) return; // 이미 종료된 대화는 다시 처리하지 않음
    
    console.log(`[대화 종료] 대화 ${conversation.id}가 비활성화되었습니다.`);
    conversation.isActive = false;
    
    conversation.participants.forEach(pId => {
        const character = characterDatabase[pId];
        if (character) {
            character.conversationId = null;
        }
    });
}

module.exports = {
    createConversation,
    addMessageToConversation,
    endConversation
};