const { callLLM } = require('./llm.js');

/**
 * 대화 기록을 바탕으로 두 캐릭터 간의 관계 변화를 추론합니다.
 * @param {object} characterA - 평가 주체 캐릭터
 * @param {object} characterB - 평가 대상 캐릭터
 * @param {object} conversation - 종료된 대화 객체
 * @param {object} characterDatabase - 전체 캐릭터 데이터베이스
 * @param {string} provider - 사용할 LLM provider
 * @returns {Promise<object|null>} - { affectionChange, trustChange } 형태의 객체
 */
async function updateRelationshipFromConversation(characterA, characterB, conversation, characterDatabase, provider) {
    const conversationLog = conversation.log
        .map(entry => `${characterDatabase[entry.speaker]?.name || '???'}: "${entry.content}"`)
        .join('\n');

    // 관계 변화 추론을 위한 특별 프롬프트
    const prompt = `
    당신은 심리 분석가입니다. 아래 대화는 '${characterA.name}'와(과) '${characterB.name}' 사이에서 일어났습니다.
    '${characterA.name}'의 입장에서, 이 대화로 인해 '${characterB.name}'에 대한 감정이 어떻게 변했는지 추론하세요.
    호감도(Affection)와 신뢰도(Trust)의 변화량을 각각 -10 (매우 나빠짐) 에서 +10 (매우 좋아짐) 사이의 점수로 평가해주세요.

    [대화 내용]
    ${conversationLog}

    [출력 형식]
    { "affectionChange": 점수, "trustChange": 점수 }

    [규칙] 숫자 앞에 '+'를 붙이지 말고, 정수만 사용하며, 오직 JSON만 출력하세요(설명·코드블록 금지).

    `;

    try {
        const rawResponse = await callLLM(prompt, provider);
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const cleaned = jsonMatch[0]
                .replace(/:\s*\+(\d+)/g, ': $1')       // +5 → 5
                .replace(/,(\s*[}\]])/g, '$1');        // 꼬리 콤마 방지
            const result = JSON.parse(cleaned);

            return {
                affectionChange: parseInt(result.affectionChange) || 0,
                trustChange: parseInt(result.trustChange) || 0,
            };
        }
        return null;
    } catch (error) {
        console.error(`[관계 업데이트 오류] ${characterA.name} -> ${characterB.name}:`, error);
        return null;
    }
}

module.exports = {
    updateRelationshipFromConversation,
};