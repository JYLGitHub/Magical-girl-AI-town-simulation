// agent/conversationInterest.js

const { callLLM } = require('../utils/llm.js');

async function checkConversationInterest(character, world) {
    // 이미 대화 중이면 끼어들지 않음
    if (character.conversationId) return null;
    
    // 같은 장소의 진행 중인 대화 찾기
    const nearbyConversations = world.activeConversations.filter(conv => {
        if (!conv.isActive || conv.participants.includes(character.id)) return false;
        
        // 대화 참여자 중 한 명이라도 같은 장소에 있으면 들을 수 있음
        return conv.participants.some(pId => {
            const participant = world.characterDatabase[pId];
            return participant && participant.location === character.location;
        });
    });
    
    if (nearbyConversations.length === 0) return null;
    
    // 가장 최근 대화 선택
    const targetConversation = nearbyConversations[0];
    const recentMessages = targetConversation.log.slice(-3);
    const conversationContext = recentMessages.map(msg => 
        `${world.characterDatabase[msg.speaker]?.name}: "${msg.content}"`
    ).join('\n');
    
    const participantNames = targetConversation.participants
        .map(pId => world.characterDatabase[pId]?.name)
        .filter(Boolean);
    
    const prompt = `당신은 '${character.name}'입니다.

    [당신의 성격]
    ${character.personality}

    [현재 상황]
    ${participantNames.join(', ')}이(가) 다음과 같은 대화를 나누고 있습니다:

    ${conversationContext}

    [질문]
    이 대화에 끼어들고 싶은지 1-10점으로 평가하세요.
    - 1-3점: 전혀 관심 없음
    - 4-6점: 약간 관심 있지만 끼어들지 않음  
    - 7-8점: 관심 있어서 끼어들고 싶음
    - 9-10점: 매우 관심 있어서 반드시 끼어들고 싶음

    JSON 형식으로만 응답:
    {
        "interestLevel": 숫자,
        "reason": "관심을 느끼는 이유"
    }`;
    
    try {
        const response = await callLLM(prompt, world.llmConfigs[character.id]?.provider || 'gemini');
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            
            if (result.interestLevel >= 7) {
                console.log(`[대화 관심] ${character.name}: ${participantNames.join(', ')}의 대화에 관심 (${result.interestLevel}점)`);
                
                return {
                    action: 'requestJoinConversation',
                    targetConversationId: targetConversation.id,
                    reason: result.reason,
                    interestLevel: result.interestLevel
                };
            }
        }
        
    } catch (error) {
        console.error(`[대화 관심 분석 오류] ${character.name}:`, error);
    }
    
    return null;
}

module.exports = {
    checkConversationInterest,
};