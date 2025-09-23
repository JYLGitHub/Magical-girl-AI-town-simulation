// simulation/inputProcessor.js
const { processScriptedAction } = require('./processors/scriptProcessor.js');
const { processConversationAction } = require('./processors/conversationProcessor.js');
const { processMovementAction } = require('./processors/movementProcessor.js');
const { endConversations } = require('./processors/conversationEndProcessor.js');
const { updateAllCharacterStats } = require('./status.js');

async function processInputs(actions, world) {
    console.log("\n--- [입력 프로세서] 액션 처리 시작 ---");
    
    const actionLogs = [];
    
    // 1. 각 액션을 적절한 프로세서로 분배
    for (const action of actions) {
        let result = { success: false };
        
        console.log(`[액션 처리] ${action.charId}: ${action.actionName}`);
        
        try {
            switch (action.actionName) {
                case 'script':
                    result = processScriptedAction(action, world);
                    break;
                    
                case 'startConversation':
                case 'continueConversation':
                case 'leaveConversation':
                case 'listen':
                    result = await processConversationAction(action, world);
                    break;
                    
                case 'sendMessage':
                case 'changeLocation':
                default:
                    result = await processMovementAction(action, world);
                    break;
            }
            
            if (result.success && result.actionLog) {
                actionLogs.push(result.actionLog);
                console.log(`[액션 성공] ${result.actionLog.description}`);
            }
            
        } catch (error) {
            console.error(`[액션 오류] ${action.charId} - ${action.actionName}:`, error);
        }
    }
    
    // 2. 종료된 대화 처리
    await endConversations(world);
    
    // 3. 캐릭터 스탯 업데이트
    updateAllCharacterStats(actions, world);
    
    console.log("--- [입력 프로세서] 처리 완료 ---\n");
    
    return { actionLogs };
}

module.exports = { processInputs };