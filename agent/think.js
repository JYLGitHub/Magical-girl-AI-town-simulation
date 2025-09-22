// agent/think.js
const { observe, buildContext } = require('./observe.js');
const { retrieveMemories } = require('../agent/memory.js');
const { callLLM } = require('../utils/llm.js');
const { scenarios, locations } = require('../core/scenarios.js');
const { searchRelevantMemories } = require('./memory.js');
const { defineSelfState } = require('./selfReflection.js');
const activeScenarioName = 'modern';

// Main agent tick function
async function agentTick(character, world) {
    // Step 1: Observe
    const observations = observe(character, world);
    console.log(`[Agent Tick] ${character.name} - Step 1: Observation complete`);
    
    // Step 2: Build context
    const context = buildContext(character, observations);
    console.log(`[Agent Tick] ${character.name} - Step 2: Context building complete`);
    
    // Step 3: Long-term thinking (reflection, planning)
    await handleLongTermThinking(character, world);
    console.log(`[Agent Tick] ${character.name} - Step 3: Long-term thinking complete`);
    
    // Step 4: Make immediate decision
    const plan = await makeImmediateDecision(character, world, context, observations);
    console.log(`[Agent Tick] ${character.name} - Step 4: Decision making complete`);
    
    return plan;
}

// Handle long-term thinking
async function handleLongTermThinking(character, world) {
    const { situation } = world;
    
    // Daily reflection and planning at midnight
    if (situation.currentHour === 0 && situation.currentMinute < 30 && character.reflectedOnDay !== situation.day) {
        await reflectOnMemories(character, world);
        await createDailyPlan(character, world);
        character.reflectedOnDay = situation.day;
        console.log(`[Long-term thinking] ${character.name} - Reflection and daily planning complete`);
    }
}

// Make immediate decision
async function makeImmediateDecision(character, world, context, observations) {
        // 상태 업데이트가 필요한 경우 우선 처리
     if (character.needsStateUpdate) {
        await require('./selfReflection.js').defineSelfState(character, world);
        character.needsStateUpdate = false;
        console.log(`[상태 변화 감지] ${character.name} - 상태 업데이트 완료`);
    }
    // Check if in conversation
    if (observations.myConversation) {
        if (observations.myConversation.turnHolder === character.id) {
            console.log(`[Decision] ${character.name} - Generating conversation response`);
            const action = await generateConversationResponse(character, world);
            return { ...action, charId: character.id };
        } else {
            console.log(`[Decision] ${character.name} - Listening to conversation`);
            return {
                actionName: 'listen',
                content: `${observations.myConversation.participants.join(', ')}의 대화를 듣고 있습니다.`,
                charId: character.id
            };
        }
    }

    // Free action decision
    if (shouldUseAI(character, world)) {
        console.log(`[Decision] ${character.name} - AI mode free action`);
        const action = await generateFreeAction(character, world);
        return { ...action, charId: character.id };
    } else {
        console.log(`[Decision] ${character.name} - Script mode`);
        const scriptPlan = processWithScript(character, world.situation);
        return {
            actionName: 'script',
            location: scriptPlan.location,
            status: scriptPlan.status,
            content: scriptPlan.content,
            thoughts: scriptPlan.thoughts,
            charId: character.id
        };
    }
}

async function runAgent(character, world) {
    return await agentTick(character, world);
}

// =======================================================================
// AI's 'long-term thinking' functions
// =======================================================================

// Reflection (period adjustment needed)
async function reflectOnMemories(character, world) {
    const recentMemories = character.journal.slice(-20);
    if (recentMemories.length < 5) return;
    const memoryDescriptions = recentMemories.map(m => `- ${m.description}`).join('\n');
    const prompt = `당신은 '${character.name}'입니다. 다음은 당신의 최근 기억 목록입니다.
    [최근 기억]
    ${memoryDescriptions}
    [임무]
    위 기억들을 바탕으로, 당신 자신이나 다른 사람과의 관계에 대해 얻게 된 중요한 깨달음이나 성찰을 요약하세요.`;

    try {
        const provider = world.llmConfigs[character.id]?.provider || 'gemini';
        const reflectionText = await callLLM(prompt, provider);
        const newMemory = {
            timestamp: new Date().toISOString(),
            description: `(성찰): ${reflectionText}`,
            poignancy: 8,
            type: 'reflection',
        };
        character.journal.push(newMemory);
        console.log(`[Reflection created] ${character.name}: ${reflectionText}`);
    } catch (error) {
        console.error(`[Reflection creation error] ${character.name}:`, error);
    }
}

// Daily planning
async function createDailyPlan(character, world) {
    const situationContext = { nearbyCharacterNames: [] };
    const relevantMemories = retrieveMemories(character, situationContext).slice(0, 5);
    const memoryContext = relevantMemories.map(m => `- ${m.description}`).join('\n');
    const prompt = `당신은 '${character.name}'입니다. 당신의 기본 정보와 최근 성찰은 다음과 같습니다.
    [기본 정보]
    - 역할: ${character.role}
    - 성격: ${character.personality}
    
    [최근 중요 기억/성찰]
    ${memoryContext}
    
    [임무]
    위 정보를 바탕으로, 오늘 하루 동안 무엇을 할지에 대한 대략적인 계획을 아침/점심/저녁으로 나누어 한두 문장으로 작성하세요.`;

    try {
        const provider = world.llmConfigs[character.id]?.provider || 'gemini';
        const planText = await callLLM(prompt, provider);
        character.dailyPlan = planText;
        console.log(`[Daily plan created] ${character.name}: ${planText}`);
    } catch (error) {
        console.error(`[Daily plan creation error] ${character.name}:`, error);
    }
}

// =======================================================================
// Helper functions (concrete thinking content)
// =======================================================================

// [Core] Function to create LLM prompt for conversation and call it
async function generateConversationResponse(character, world) {
    console.log(`[Debug] ${character.name}'s conversationId:`, character.conversationId);
    console.log(`[Debug] activeConversations count:`, world.activeConversations.length);
    console.log(`[Debug] activeConversations IDs:`, world.activeConversations.map(c => c.id));
    
    const { situation, llmConfigs, activeConversations, characterDatabase } = world;
    const currentConversation = activeConversations.find(conv => conv.id === character.conversationId);
    const provider = llmConfigs[character.id]?.provider || 'gemini';
    console.log(`[Debug] ${character.name}'s currentConversation:`, currentConversation ? 'exists' : 'undefined');

    const otherParticipants = currentConversation.participants
        .filter(pId => pId !== character.id)
        .map(pId => characterDatabase[pId])
        .filter(Boolean);

    const nearbyCharacters = Object.values(characterDatabase).filter(c => c.id !== character.id && c.location === character.location);
    const otherParticipantNames = otherParticipants.map(p => p.name);
    const situationContext = { nearbyCharacterNames: otherParticipantNames };
    const relevantMemories = require('./memory.js').retrieveMemories(character, situationContext).slice(0, 3);
    const memoryContext = relevantMemories.length > 0
        ? `[관련 기억]\n` + relevantMemories.map(m => `- ${m.description}`).join('\n')
        : '[특별히 떠오르는 기억이 없습니다.]';

    const participantInfo = otherParticipants.map(other => {
        const relationshipInfo = getRelationshipContext(character, other.name);
        return `- ${other.name}: ${other.role}, ${relationshipInfo}`;
    }).join('\n');
    
    const conversationLog = currentConversation.log
        .map(entry => `${characterDatabase[entry.speaker]?.name || '???'}: "${entry.content}"`)
        .join('\n');

    const timeContext = `현재 시간: Day ${situation.day}, ${situation.currentHour}:${situation.currentMinute.toString().padStart(2, '0')}`;
    const nearbyContext = `주변 인물: ${nearbyCharacters.map(c => c.name).join(', ') || '없음'}`;
    const allCharactersContext = `[월드에 있는 모든 캐릭터 목록]\n` + Object.values(characterDatabase).map(c => `- ${c.name} (현재 위치: ${c.location})`).join('\n');
    const locationNames = Object.keys(locations).join(', ');

    const prompt = `당신은 '${character.name}'입니다. 당신은 지금 [${otherParticipantNames.join(', ')}]와(과) 대화하고 있습니다.

    [당신의 정체성]
    - 역할: ${character.role}
    - 성격: ${character.personality}

    [대화 상대방 정보]
    ${participantInfo}
    
    [현재 당신의 상태]
    - 현재 기분: ${character.mood}
    - 에너지 레벨: ${character.energy} / 100
    - 스트레스 지수: ${character.stress} / 100
    - 사회적 욕구: ${character.socialNeed} / 100
    - 현재 상태: ${character.status} (위치: ${character.location})

    ${memoryContext}

    [현재 상황]
    ${timeContext} (24시간제)
    ${nearbyContext}
    ${allCharactersContext}

    [선택 가능한 장소 목록]
    ${locationNames}

    [대화 기록]
    ${conversationLog}

    [당신의 임무]
    당신의 프로필, 역할과 성격은 당신의 '정체성'이며, 모든 행동의 최우선 기준입니다.
    **당신의 정체성과 상대방의 프로필, 상대방과의 관계, 그리고 대화의 흐름을 고려하여 다음 할 말을 결정하세요.**
    - 당신의 현재 기분과 상태를 행동과 대화에 자연스럽게 드러내세요. 예를 들어, 에너지가 낮다면 "(피곤한 목소리로) 안녕..."과 같이 말할 수 있습니다.
    - 대화는 영원히 지속될 수 없습니다. 할 말이 떨어졌거나, 다른 할 일이 생각났거나, 대화가 충분히 길어졌다고 판단되면 "leaveConversation" 액션을 사용해 자연스럽게 대화를 마무리하세요.
    - 대화를 끝내고 싶거나, 작별 인사를 했다면 반드시 'leaveConversation' 액션을 사용해야 합니다.
    - 대화는 핑퐁이 되어야 합니다. 대사가 너무 길어지면 상대방이 지루해 할 수 있습니다.

    [출력 형식]
    - 대화를 계속 이어갈 경우:
    { "thoughts": "...", "actionName": "continueConversation", "content": "대화 내용(3문장 이내)", "nextSpeaker": "다음 발언자 이름" }

    - 대화를 완전히 끝낼 경우:
    { "thoughts": "...", "actionName": "leaveConversation", "content": "작별 인사(3문장 이내)" }`;
    try {
        const rawResponse = await callLLM(prompt, provider);
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return { thoughts: "AI 응답(대화)에서 JSON을 찾지 못함", actionName: "talkToSelf", content: "(JSON 파싱 오류)" };
    } catch (error) {
        return { thoughts: "AI 호출(대화) 중 오류 발생: " + error.message, actionName: "talkToSelf", content: "(AI 호출 오류)" };
    }
}
    
// Free action LLM prompt generation function (example)
async function generateFreeAction(character, world) {
    const { situation, llmConfigs, activeConversations, characterDatabase } = world;
    const provider = llmConfigs[character.id]?.provider || 'gemini';

    // Logic when not in conversation
    const nearbyCharacters = Object.values(characterDatabase).filter(c => c.id !== character.id && c.location === character.location);
    
    const situationContext = { nearbyCharacterNames: nearbyCharacters.map(c => c.name) };
    const relevantMemories = await searchRelevantMemories(character, situationContext, provider);
    
    let scheduleInfo = '특별한 스케줄 없음';
    try {
        const currentSchedule = applySchedule(character, world.situation);
        if (currentSchedule) {
            scheduleInfo = `현재 스케줄: ${currentSchedule.status} (${currentSchedule.location}에서)`;
        }
    } catch (error) {
        console.warn(`[스케줄 조회 오류] ${character.name}:`, error);
    }

    const memoryContext = relevantMemories.length > 0
        ? `[당신이 현재 상황과 관련하여 떠올린 기억들 (중요도와 최신순)]\n` + relevantMemories.map(m => `- ${m.description} (중요도: ${m.poignancy})`).join('\n')
        : '[현재 특별히 떠오르는 기억이 없습니다.]';
    
    const timeContext = `현재 시간: Day ${situation.day}, ${situation.currentHour}:${situation.currentMinute.toString().padStart(2, '0')}`;
    const nearbyContext = `주변 인물: ${nearbyCharacters.map(c => c.name).join(', ') || '없음'}`;
    const allCharactersContext = `[월드에 있는 모든 캐릭터 목록]\n` + Object.values(characterDatabase).map(c => `- ${c.name} (현재 위치: ${c.location})`).join('\n');
    const locationNames = Object.keys(locations).join(', ');

    // Fix nearby character info (when nearbyCharacters is empty)
    const participantInfo = nearbyCharacters.length > 0 
        ? nearbyCharacters.map(other => {
            const relationshipInfo = getRelationshipContext(character, other.name);
            return `- ${other.name}: ${other.role}, ${relationshipInfo}`;
          }).join('\n')
        : '주변에 아무도 없습니다.';

    // 메시지 알림 추가
    let alertContext = '';
    if (character.hasNewMessage) {
        alertContext = `[알림] ${character.newMessageAlert}`;
    }

    // Free action prompt
    const prompt = `당신은 '${character.name}'입니다. 당신의 정체성, 현재 감정 상태, 현재 상황, 그리고 떠오른 기억들을 바탕으로 다음에 무엇을 할지 결정하세요.

    ${alertContext}

    [당신의 정체성]
    - 역할: ${character.role}
    - 성격: ${character.personality}
    
    [현재 당신의 상태]
    - 현재 기분: ${character.mood}
    - 에너지 레벨: ${character.energy} / 100
    - 스트레스 지수: ${character.stress} / 100
    - 사회적 욕구: ${character.socialNeed} / 100
    - 현재 상태: ${character.status} (위치: ${character.location})

    [주변인 정보]
    ${participantInfo}

    ${memoryContext}

    [현재 시간과 스케줄]
    ${timeContext} (24시간제)
    ${scheduleInfo}

    [현재 상황]
    ${nearbyContext}
    ${allCharactersContext}

    [선택 가능한 장소 목록]
    ${locationNames}

    [행동 규칙]
    - 당신의 프로필, 역할과 성격은 당신의 '정체성'이며, 모든 행동의 최우선 기준입니다.
    - 당신의 모든 행동은 당신의 정체성과 현재 상태(에너지, 스트레스, 사회적 욕구)에 큰 영향을 받습니다. 예를 들어, 스트레스가 높고 에너지가 낮다면 중요한 약속/스케쥴도 취소하거나 미루고 싶을 수 있습니다.
    - 대화를 걸 때는 **당신의 정체성과 상대방의 프로필, 상대방과의 관계, 현재 상황 및 대화 목적을 고려하여 다음 할 말을 결정하세요.**
    - 당신의 현재 기분과 상태를 행동과 대화에 자연스럽게 드러내세요. 예를 들어, 에너지가 낮다면 "(피곤한 목소리로) 안녕..."과 같이 말할 수 있습니다.
    - 이동하거나 약속 장소를 정할 때는, 반드시 [선택 가능한 장소 목록]에 있는 이름만 사용해야 합니다.
    - 메시지는 다른 장소에 있는 사람과의 소통을 위한 원거리 통신 수단입니다. 절대 같은 장소의 사람에게 메시지를 보내지 마세요.

    [출력 형식 규칙]
    {
    "thoughts": "당신의 생각의 흐름을 적으세요(2문장 이내).",
    "actionName": "startConversation | script | talkToSelf | sendMessage 등...",
    "content": "첫 대화 내용 또는 행동에 대한 묘사(3문장 이내)",
    "target": ["대상이 있다면 이름"],
    "targetLocation": "이동할 장소 이름"
    }`;
    try {
        const rawResponse = await callLLM(prompt, world.llmConfigs[character.id]?.provider);
        
        // Stronger JSON extraction
        let jsonStr = '';
        
        // Find first {
        const startIndex = rawResponse.indexOf('{');
        if (startIndex === -1) {
            throw new Error('JSON start part not found');
        }
        
        // Find last } (considering nested objects)
        let braceCount = 0;
        let endIndex = -1;
        
        for (let i = startIndex; i < rawResponse.length; i++) {
            if (rawResponse[i] === '{') braceCount++;
            else if (rawResponse[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    endIndex = i;
                    break;
                }
            }
        }
        
        if (endIndex === -1) {
            throw new Error('JSON end part not found');
        }
        
        jsonStr = rawResponse.substring(startIndex, endIndex + 1);

        console.log(`[Extracted JSON] ${character.name}:`, jsonStr);

        // 알림 플래그 제거
        if (character.hasNewMessage) {
            character.hasNewMessage = false;
            character.newMessageAlert = null;
        }

        return JSON.parse(jsonStr);
        
    } catch (error) {
        console.error(`[LLM parsing error] ${character.name}: ${error.message}`);
        console.error(`[Original response]`, rawResponse);
        
        // 에러 시에도 알림 플래그 제거
        if (character.hasNewMessage) {
            character.hasNewMessage = false;
            character.newMessageAlert = null;
        }
        return { 
            thoughts: `Parsing error: ${error.message}`, 
            actionName: "talkToSelf", 
            content: "(AI response processing error)" 
        };
    }
    
}

function shouldUseAI(character, world) {
    const scheduleSet = scenarios[activeScenarioName]?.archetypes[character.archetype]?.schedule;
    const schedule = applySchedule(character, world.situation);
    if (schedule && (schedule.status.includes('수면') || schedule.status.includes('취침'))) {
        return false;
    }
    
    // **If there's an appointment, always use AI**
    const situationContext = { nearbyCharacterNames: [] };
    const relevantMemories = require('./memory.js').retrieveMemories(character, situationContext);
    const hasImportantPlan = relevantMemories.some(memory => 
        memory.type === 'plan' && memory.score > 2.0
    );
    
    if (hasImportantPlan) {
        console.log(`[Forced AI mode] ${character.name} - Important appointment exists, switching to AI mode`);
        return true;
    }
    //스케쥴 기반 판단
    const isEssential = schedule && (schedule.status.includes('근무') || schedule.status.includes('공부') || schedule.status.includes('영업'));
    const isFreeTime = schedule && (schedule.status.includes('휴식') || schedule.status.includes('자유 시간'));

    let aiProbability = 0.05; // Default probability
    if (isEssential) {
        aiProbability = 0.03;
    } else if (isFreeTime) {
        aiProbability = 1;
    }

    const nearbyCharacters = Object.values(world.characterDatabase).filter(c => c.id !== character.id && c.location === character.location && !c.conversationId);
    if (nearbyCharacters.length > 0) {
        aiProbability += isEssential ? 0.15 : 0.25;
    }
    if ((character.socialNeed || 0) > 80) {
        aiProbability += 0.2;
    }
    return Math.random() < Math.min(1, aiProbability);
}

// Helper function to check character's schedule and apply it
function applySchedule(character, situation) {
    if (Math.random() < 0.2) {
    console.log(`[Schedule check] ${character.name} (${character.archetype}) - Current time: ${situation.currentHour}:00`);
    }
    const scheduleSet = scenarios[activeScenarioName]?.archetypes[character.archetype]?.schedule;

    if (!scheduleSet) {
        console.log(`[Schedule error] Cannot find schedule for ${character.name}'s archetype(${character.archetype})`);
        return null;
    }

    if (!scheduleSet) return null;
    const dayOfWeek = (situation.day - 1) % 7;
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dailySchedule = scheduleSet[dayNames[dayOfWeek]];
    if (!dailySchedule) return null;
    const scheduleTimes = Object.keys(dailySchedule).map(h => parseInt(h)).sort((a, b) => a - b);
    let activeSchedule = null;
    for (const scheduleHour of scheduleTimes) {
        if (situation.currentHour >= scheduleHour) {
            activeSchedule = dailySchedule[scheduleHour];
        }
    }
    if (activeSchedule === null && scheduleTimes.length > 0) {
        activeSchedule = dailySchedule[scheduleTimes[scheduleTimes.length - 1]];
    }
        if (activeSchedule && activeSchedule.location === "home") {
        activeSchedule = {
            ...activeSchedule,
            location: character.homeLocation || character.location
        };
    }

    return activeSchedule;
}

// Helper function to handle basic actions according to schedule
function processWithScript(character, situation) {
    const schedule = applySchedule(character, situation);
    if (!schedule) {
        const idleActions = [
            { status: "(생각 중...)", action: "(가만히 서서 생각에 잠겨 있다.)" },
            { status: "(창밖 구경)", action: "(창밖을 멍하니 바라보고 있다.)" },
            { status: "(폰 보는 중)", action: "(휴대폰을 만지작거리고 있다.)" },
            { status: "(주변 둘러보기)", action: "(주변을 천천히 둘러보고 있다.)" }
        ];
        const randomIndex = Math.floor(Math.random() * idleActions.length);
        const idleAction = idleActions[randomIndex];
        return {
            location: character.location,
            status: idleAction.status,
            content: idleAction.action,
            thoughts: "(특별한 계획 없이 시간을 보내는 중)",
        };
    }
    // 현재 위치가 스케줄과 다르다면 점진적 이동
    if (character.location !== schedule.location) {
        return {
            location: character.location, // 현재 위치 유지
            status: `${schedule.status} 예정이지만 ${character.location}에 머물고 있음`,
            content: `${character.location}에서 ${schedule.status}을(를) 하려고 합니다.`,
            thoughts: "(스케줄과 위치가 달라 조정 중)",
        };
    }
    return {
        location: schedule.location,
        status: schedule.status,
        content: `${schedule.status} 중입니다.`,
        thoughts: "(스크립트에 따라 행동 중)",
    };
}

// This function is material for LLM prompts, so it remains in ai.js that creates prompts
function getRelationshipContext(character, targetName) {
    if (!character.relationships || !character.relationships[targetName]) {
        return `${targetName}은(는) 처음 만나는 사람입니다.`;
    }
    const rel = character.relationships[targetName];
    let context = `${targetName}과(와)의 관계: `;
    if (rel.affection > 70) context += "매우 친함";
    else if (rel.affection > 40) context += "친함";
    else if (rel.affection > 10) context += "호감";
    else if (rel.affection > -10) context += "보통";
    else context += "불편함";
    context += ` (호감도: ${Math.round(rel.affection)}, 신뢰도: ${Math.round(rel.trust)})`;
    return context;
}

module.exports = { 
    runAgent,           // Keep existing
    agentTick,          // Newly added
    handleLongTermThinking,  // Newly added
    makeImmediateDecision    // Newly added
};