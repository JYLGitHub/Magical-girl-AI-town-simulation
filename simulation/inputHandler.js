// simulation/inputHandler.js
const { processInputs } = require('./inputProcessor.js');

async function processActions(actions, world) {
    console.log("\n--- [핸들러] 액션 처리 요청 수신 ---");
    console.log(`처리할 액션 수: ${actions.length}`);
    
    // 모든 처리를 inputProcessor에 위임
    const result = await processInputs(actions, world);
    
    // 최종 결과 출력
    const { day, currentHour, currentMinute } = world.situation;
    const dayOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][(day) % 7];
    console.log(`\n--- [${day}일차 (${dayOfWeek}) ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}] ---`);

    for (const character of Object.values(world.characterDatabase)) {
        const log = result.actionLogs.find(l => l.charId === character.id);
        let displayText = '';
        
        if (log) {
            displayText = log.description;
        } else if (character.conversationId) {
            const currentConv = world.activeConversations.find(c => c.id === character.conversationId);
            if (currentConv) {
                displayText = `${currentConv.participants.map(pId => world.characterDatabase[pId]?.name).join(', ')}의 대화를 듣고 있습니다.`;
            }
        } else {
            displayText = '대기 중...';
        }
        
        console.log(`  - [${character.location}] ${character.name}: ${displayText}`);
    }
    
    return result;
}

module.exports = { processActions };