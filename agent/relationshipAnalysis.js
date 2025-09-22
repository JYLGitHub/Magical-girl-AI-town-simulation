// agent/relationshipAnalysis.js

const { callLLM } = require('../utils/llm.js');
const { createRelationship } = require('../core/schema.js');

async function updateRelationshipDefinition(characterA, characterB, conversation, characterDatabase, provider) {
    // 기존 관계가 없으면 새로 생성
    if (!characterA.relationships[characterB.name]) {
        characterA.relationships[characterB.name] = createRelationship(characterA.name, characterB.name);
        characterA.relationships[characterB.name].firstMet = new Date().toISOString();
    }
    
    const currentRel = characterA.relationships[characterB.name];
    const conversationLog = conversation.log
        .map(entry => `${characterDatabase[entry.speaker]?.name || '???'}: "${entry.content}"`)
        .join('\n');

    // 과거 관계 기록 요약
    const pastMemories = currentRel.sharedExperiences.slice(-3).join(' / ');
    const relationshipHistory = pastMemories ? `과거 기억: ${pastMemories}` : '처음 만남';

    const prompt = `당신은 '${characterA.name}'입니다. 
    
    [당신의 성격과 가치관]
    ${characterA.personality}

    [현재 '${characterB.name}'와의 관계]
    - 현재 관계: ${currentRel.relationshipType}
    - 호감도: ${currentRel.affection}/100
    - 신뢰도: ${currentRel.trust}/100  
    - 존경도: ${currentRel.respect}/100
    - 친밀도: ${currentRel.familiarity}/100
    - ${relationshipHistory}

    [방금 나눈 대화]
    ${conversationLog}

    [임무]
    이 대화를 통해 '${characterB.name}'에 대한 감정과 관계가 어떻게 변했는지 솔직하게 분석하세요.

    JSON 형식으로만 응답:
    {
        "relationshipType": "새로운 관계 정의",
        "relationshipSummary": "이 사람에 대한 감정을 2-3문장으로 설명",
        "affectionChange": 숫자,
        "trustChange": 숫자,
        "respectChange": 숫자,
        "familiarityChange": 숫자,
        "energyModifier": 숫자,
        "stressModifier": 숫자,
        "moodInfluence": "긍정적/부정적/중립",
        "memorableExperience": "기억할 만한 경험 설명"
    }`;

    try {
        const rawResponse = await callLLM(prompt, provider);
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            
            // 관계 업데이트 적용
            currentRel.relationshipType = analysis.relationshipType;
            currentRel.relationshipSummary = analysis.relationshipSummary;
            
            // 수치 변화 적용
            currentRel.affection = Math.max(0, Math.min(100, currentRel.affection + (analysis.affectionChange || 0)));
            currentRel.trust = Math.max(0, Math.min(100, currentRel.trust + (analysis.trustChange || 0)));
            currentRel.respect = Math.max(0, Math.min(100, currentRel.respect + (analysis.respectChange || 0)));
            currentRel.familiarity = Math.max(0, Math.min(100, currentRel.familiarity + (analysis.familiarityChange || 0)));
            
            // 상호작용 효과 업데이트
            currentRel.energyModifier = Math.max(-10, Math.min(10, analysis.energyModifier || 0));
            currentRel.stressModifier = Math.max(-10, Math.min(10, analysis.stressModifier || 0));
            currentRel.moodInfluence = analysis.moodInfluence || "중립";
            
            // 상호작용 기록 업데이트
            currentRel.interactionCount++;
            currentRel.conversationCount++;
            currentRel.lastInteraction = new Date().toISOString();
            
            // 기억할 만한 경험 저장
            if (analysis.memorableExperience) {
                currentRel.sharedExperiences.push(analysis.memorableExperience);
                if (currentRel.sharedExperiences.length > 10) {
                    currentRel.sharedExperiences = currentRel.sharedExperiences.slice(-10);
                }
            }
            
            console.log(`[관계 분석 완료] ${characterA.name} → ${characterB.name}`);
            console.log(`  새로운 관계: "${currentRel.relationshipType}"`);
            
            return analysis;
        }
        
        console.error(`[관계 분석 실패] ${characterA.name}: JSON 파싱 실패`);
        return null;
        
    } catch (error) {
        console.error(`[관계 분석 오류] ${characterA.name} → ${characterB.name}:`, error);
        return null;
    }
}

module.exports = {
    updateRelationshipDefinition,
};