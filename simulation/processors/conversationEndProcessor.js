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
    
    // 3. 관계 업데이트
    const ids = conversation.participantHistory || [];
    for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
            const a = world.characterDatabase[ids[i]];
            const b = world.characterDatabase[ids[j]];
            if (!a || !b) continue;

            const deltaAB = await updateRelationshipFromConversation(
                a, b, conversation, world.characterDatabase, provider
            );
            const deltaBA = await updateRelationshipFromConversation(
                b, a, conversation, world.characterDatabase, provider
            );

            if (deltaAB) {
                a.relationships[b.name] = a.relationships[b.name] || { affection: 50, trust: 50 };
                a.relationships[b.name].affection += deltaAB.affectionChange;
                a.relationships[b.name].trust += deltaAB.trustChange;
                console.log(`- 관계 변화 ${a.name}→${b.name}: ❤️ ${deltaAB.affectionChange}, 🤝 ${deltaAB.trustChange}`);
            }
            
            if (deltaBA) {
                b.relationships[a.name] = b.relationships[a.name] || { affection: 50, trust: 50 };
                b.relationships[a.name].affection += deltaBA.affectionChange;
                b.relationships[a.name].trust += deltaBA.trustChange;
                console.log(`- 관계 변화 ${b.name}→${a.name}: ❤️ ${deltaBA.affectionChange}, 🤝 ${deltaBA.trustChange}`);
            }
        }
    }
}

module.exports = { endConversations };