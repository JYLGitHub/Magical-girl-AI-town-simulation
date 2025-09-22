// 📍 status.js

/**
 * 캐릭터의 행동과 상호작용에 따라 스탯(기분, 에너지 등)을 업데이트합니다.
 * @param {object} character - 업데이트할 캐릭터 객체
 * @param {object} myPlan - 이 캐릭터의 현재 행동 계획
 * @param {object} worldState - 현재 세계의 전체 상태
 */
// ⭐ allPlans를 myPlan으로 변경하여, 계획 1개만 받도록 수정합니다.
function updateCharacterStats(character, myPlan, world) {
    if (!myPlan) return;

    const actionName = myPlan.actionName || 'script';
    const actionContent = myPlan.content || ''; // content 필드도 확인
    // 변수 선언 추가
    let energyChange = 0;
    let stressChange = 0;
    let socialNeedChange = 0;

    // --- 1. 에너지 변화 ---
    const isSleeping = actionName.includes('sleep') || actionContent.includes('수면') || actionContent.includes('잠');
    const isResting = actionName.includes('relax') || actionName.includes('rest') || actionContent.includes('휴식');
    const isWorking = actionName.includes('work') || actionName.includes('study') || actionContent.includes('공부') || actionContent.includes('근무');

    if (isSleeping) {
        energyChange += 20;
        stressChange -= 15;
    } else if (isResting) {
        energyChange += 5;
        stressChange -= 5;
    } else if (isWorking) {
        energyChange -= 5;
        stressChange += 2;
    } else {
        energyChange -= 0.5;
    }

    // --- 2. 사회적 상호작용 기본 효과 ---
    if (actionName.includes('Conversation')) {
        socialNeedChange += 10;
        energyChange -= 2;
    } else {
        socialNeedChange -= 0.5;
    }


    // --- 3. 관계 기반 효과 적용 ---
    if (world && action.interactionTarget) {
        const targetName = action.interactionTarget;
        const relationship = character.relationships[targetName];
        
        if (relationship) {
            energyChange += relationship.energyModifier || 0;
            stressChange += relationship.stressModifier || 0;
            
            if (relationship.familiarity > 80) {
                energyChange += 2;
                stressChange -= 2;
                socialNeedChange += 3;
            } else if (relationship.familiarity < 20) {
                energyChange -= 1;
                stressChange += 1;
            }
            
            if (relationship.affection > 80) {
                energyChange += 3;
                stressChange -= 3;
            } else if (relationship.affection < 20) {
                energyChange -= 3;
                stressChange += 5;
                socialNeedChange -= 2;
            }
            
            if (relationship.trust > 80) {
                stressChange -= 2;
            } else if (relationship.trust < 30) {
                stressChange += 3;
            }
            
            if (relationship.respect > 80) {
                socialNeedChange += 2;
            }
            
            console.log(`[관계 효과] ${character.name} ← ${targetName}: 에너지(${relationship.energyModifier}), 스트레스(${relationship.stressModifier})`);
        }
    }


    // --- 4. 대화 중인 경우 상대방 관계 효과 ---
    if (world && character.conversationId && !action.interactionTarget) {
        const conversation = world.activeConversations.find(conv => conv.id === character.conversationId);
        if (conversation) {
            const otherParticipants = conversation.participants.filter(pId => pId !== character.id);
            
            let totalEnergyEffect = 0;
            let totalStressEffect = 0;
            let participantCount = 0;
            
            otherParticipants.forEach(pId => {
                const otherChar = world.characterDatabase[pId];
                if (otherChar && character.relationships[otherChar.name]) {
                    const rel = character.relationships[otherChar.name];
                    totalEnergyEffect += rel.energyModifier || 0;
                    totalStressEffect += rel.stressModifier || 0;
                    participantCount++;
                }
            });
            
            if (participantCount > 0) {
                energyChange += totalEnergyEffect / participantCount;
                stressChange += totalStressEffect / participantCount;
            }
        }
    }

    // --- 5. 최종 스탯 적용 ---
    character.energy = Math.max(0, Math.min(100, character.energy + energyChange));
    character.stress = Math.max(0, Math.min(100, character.stress + stressChange));
    character.socialNeed = Math.max(0, Math.min(100, character.socialNeed + socialNeedChange));

    // --- 6. 극단적 상황 처리 ---
    if (character.energy < 20) {
        character.stress = Math.min(100, character.stress + 5);
    }
    
    if (character.stress > 80) {
        character.energy = Math.max(0, character.energy - 3);
    }
    
    if (character.socialNeed < 10) {
        character.stress = Math.min(100, character.stress + 3);
    }

    if (Math.abs(energyChange) > 0.1 || Math.abs(stressChange) > 0.1) {
        console.log(`[스탯 변화] ${character.name}: 에너지(${energyChange.toFixed(1)}) 스트레스(${stressChange.toFixed(1)}) 사회욕구(${socialNeedChange.toFixed(1)})`);
    }
    if (Math.abs(energyChange) > 0.1 || Math.abs(stressChange) > 0.1) {
    console.log(`[스탯 변화] ${character.name}: 에너지(${energyChange.toFixed(1)}) 스트레스(${stressChange.toFixed(1)}) 사회욕구(${socialNeedChange.toFixed(1)})`);
    
    // 큰 변화가 있었다면 상태 업데이트 트리거
    const shouldUpdateState = Math.abs(energyChange) > 5 || Math.abs(stressChange) > 5 || 
                                character.energy < 20 || character.stress > 80;
        
        if (shouldUpdateState) {
            character.needsStateUpdate = true;
        }
    }
}

module.exports = { updateCharacterStats };