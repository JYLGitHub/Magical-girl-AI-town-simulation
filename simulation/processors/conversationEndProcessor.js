// simulation/processors/conversationEndProcessor.js
const { createMemoryFromConversation } = require('../../agent/memory.js');
const { createPlanFromConversation } = require('../../agent/planning.js');
const { updateRelationshipFromConversation } = require('../relationships.js');
const { endConversation } = require('../../agent/conversation.js');

async function endConversations(world) {
    console.log("\n--- [3단계: 종료된 대화 처리] ---");
    
    // 종료될 대화들 찾기
    const conversationsToEnd = world.activeConversations.filter(conv => 
        conv.isActive && conv.participants.length < 2
    );
    
    console.log(`[디버깅] 종료될 대화 개수: ${conversationsToEnd.length}`);
    
    for (const conv of conversationsToEnd) {
        await processEndedConversation(conv, world);
        
        // 대화 종료 처리 (순수한 데이터 조작만)
        endConversation(conv, world.characterDatabase);
    }
    
    // 비활성화된 대화들 제거
    world.activeConversations = world.activeConversations.filter(c => c.isActive);
}

async function processEndedConversation(conversation, world) {
    if (!conversation.log || conversation.log.length === 0) {
        return;
    }
    
    console.log(`[대화 종료 처리 시작] 대화 ID: ${conversation.id}, 참여자: ${conversation.participantHistory}`);
    
    const provider = world.llmConfigs[conversation.participantHistory[0]]?.provider || 'gemini';
    
    // 1. 약속 생성
    const newPlan = await createPlanFromConversation(
        conversation, 
        world.characterDatabase, 
        provider, 
        world.situation
    );
    
    if (newPlan && newPlan.participants) {
        newPlan.participants.forEach(name => {
            const char = Object.values(world.characterDatabase).find(c => c.name === name);
            if (char) char.journal.push(newPlan);
        });
        console.log(`[약속 기록!] ${newPlan.day}일차 ${newPlan.hour}:${newPlan.minute} ...`);
    }
    
    // 2. 각 참여자별 기억 생성
    for (const participantId of conversation.participantHistory) {
        const character = world.characterDatabase[participantId];
        if (!character) continue;
        
        console.log(`[기억 생성 시도] ${character.name}에 대해 기억 생성 중...`);
        const newMemory = await createMemoryFromConversation(
            character, 
            conversation, 
            world.characterDatabase, 
            provider
        );
        
        console.log(`[기억 생성 결과] ${character.name}: ${newMemory ? '성공' : '실패'}`);
        if (newMemory) {
            character.journal.push(newMemory);
            console.log(`[기억 저장 완료] ${character.name}: ${newMemory.description} (중요도: ${newMemory.poignancy})`);
        }
    }
    
    // 3. 관계 업데이트 - 새로운 AI 기반 시스템 사용
    const ids = conversation.participantHistory || [];
    for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
            const charA = world.characterDatabase[ids[i]];
            const charB = world.characterDatabase[ids[j]];
            if (!charA || !charB) continue;

            // A의 관점에서 B에 대한 관계 분석
            console.log(`[관계 분석 시작] ${charA.name} → ${charB.name}`);
            const analysisAB = await updateRelationshipFromConversation(
                charA, charB, conversation, world.characterDatabase, provider
            );

            // B의 관점에서 A에 대한 관계 분석  
            console.log(`[관계 분석 시작] ${charB.name} → ${charA.name}`);
            const analysisBA = await updateRelationshipFromConversation(
                charB, charA, conversation, world.characterDatabase, provider
            );

            if (analysisAB) {
                console.log(`[관계 업데이트] ${charA.name} → ${charB.name}:`);
                console.log(`  새로운 관계: "${analysisAB.relationshipType}"`);
                console.log(`  감정 변화: 호감(${analysisAB.affectionChange}) 신뢰(${analysisAB.trustChange}) 존경(${analysisAB.respectChange})`);
                console.log(`  상호작용 효과: 에너지(${analysisAB.energyModifier}) 스트레스(${analysisAB.stressModifier})`);
                
                // 특별한 관계 변화가 있었다면 로그 기록
                if (Math.abs(analysisAB.affectionChange) > 10 || Math.abs(analysisAB.trustChange) > 10) {
                    console.log(`  🔥 [주목할 만한 관계 변화] ${charA.name}의 ${charB.name}에 대한 감정이 크게 변했습니다!`);
                }
            }
            
            if (analysisBA) {
                console.log(`[관계 업데이트] ${charB.name} → ${charA.name}:`);
                console.log(`  새로운 관계: "${analysisBA.relationshipType}"`);
                console.log(`  감정 변화: 호감(${analysisBA.affectionChange}) 신뢰(${analysisBA.trustChange}) 존경(${analysisBA.respectChange})`);
                console.log(`  상호작용 효과: 에너지(${analysisBA.energyModifier}) 스트레스(${analysisBA.stressModifier})`);
                
                if (Math.abs(analysisBA.affectionChange) > 10 || Math.abs(analysisBA.trustChange) > 10) {
                    console.log(`  🔥 [주목할 만한 관계 변화] ${charB.name}의 ${charA.name}에 대한 감정이 크게 변했습니다!`);
                }
            }
            
            // 관계 호환성 분석 (옵션)
            if (analysisAB && analysisBA) {
                const compatibilityAnalysis = require('../relationships.js').analyzeRelationshipCompatibility(
                    charA.relationships[charB.name],
                    charB.relationships[charA.name]
                );
                
                if (compatibilityAnalysis) {
                    console.log(`[관계 호환성] ${charA.name} ↔ ${charB.name}: ${compatibilityAnalysis.compatibility} (${compatibilityAnalysis.pattern})`);
                }
            }
        }
    }
    
    // 4. 관계 기록 정리 (메모리 절약)
    for (const participantId of conversation.participantHistory) {
        const character = world.characterDatabase[participantId];
        if (!character) continue;
        
        Object.values(character.relationships).forEach(relationship => {
            require('../relationships.js').cleanupRelationshipHistory(relationship);
        });
    }
}

module.exports = { endConversations };