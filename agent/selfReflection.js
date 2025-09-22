// agent/selfReflection.js

const { callLLM } = require('../utils/llm.js');

async function defineSelfState(character, world) {
    const recentActions = character.journal.slice(-3).map(j => j.description || j.activity || '활동 기록').join(', ');
    const currentStats = {
        energy: character.energy,
        stress: character.stress,
        socialNeed: character.socialNeed
    };
    
    const prompt = `당신은 '${character.name}'입니다.

    [당신의 성격]
    ${character.personality}

    [현재 수치]
    - 에너지: ${currentStats.energy}/100
    - 스트레스: ${currentStats.stress}/100  
    - 사회적 욕구: ${currentStats.socialNeed}/100

    [최근 활동]
    ${recentActions || '특별한 활동 없음'}

    현재 기분과 상태를 자연스러운 한국어로 표현하세요.

    JSON 형식으로만 응답:
    {
        "mood": "기분 상태",
        "statusDescription": "한 문장으로 상태 설명"
    }`;
    
    try {
        const response = await callLLM(prompt, world.llmConfigs[character.id]?.provider || 'gemini');
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            character.mood = result.mood;
            character.statusDescription = result.statusDescription;
            
            console.log(`[자가 상태 정의] ${character.name}: ${result.mood} - ${result.statusDescription}`);
            return result;
        }
        
    } catch (error) {
        console.error(`[자가 상태 정의 오류] ${character.name}:`, error);
    }
    
    return null;
}

module.exports = {
    defineSelfState,
};