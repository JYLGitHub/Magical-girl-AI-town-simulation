// 📍 ai.js 캐릭터 한 명의 생각만 깊게 파고들어 "저는 이렇게 행동하겠습니다" 라는 계획서 하나만 반환하는 '두뇌' 역할
const { callLLM } = require('./llm.js');
const { retrieveMemories } = require('./memory.js');
const { scenarios, locations } = require('./scenarios.js');
const activeScenarioName = 'modern';

//이 함수는 LLM 프롬프트의 재료이므로, 프롬프트를 만드는 ai.js에 남겨둡니다.
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

// 캐릭터의 스케줄을 확인하고 적용하는 보조 함수입니다.
function applySchedule(character, situation) {
    if (Math.random() < 0.2) {
    console.log(`[스케줄 확인] ${character.name} (${character.archetype}) - 현재시간: ${situation.currentHour}시`);
    }
    const scheduleSet = scenarios[activeScenarioName]?.archetypes[character.archetype]?.schedule;

    if (!scheduleSet) {
        console.log(`[스케줄 오류] ${character.name}의 archetype(${character.archetype}) 스케줄을 찾을 수 없음`);
        return null;
    }

    if (!scheduleSet) return null;
    const dayOfWeek = (situation.day - 1) % 7;
    const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6);
    const dailySchedule = isWeekend ? scheduleSet.weekend : scheduleSet.weekday;
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
    return activeSchedule;
}

// 스케줄에 따른 기본 행동을 처리하는 보조 함수입니다.
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
    return {
        location: schedule.location,
        status: schedule.status,
        content: `${schedule.status} 중입니다.`,
        thoughts: "(스크립트에 따라 행동 중)",
    };
}

function shouldUseAI(character, world) {
    const schedule = applySchedule(character, world.situation);
    if (schedule && (schedule.status.includes('수면') || schedule.status.includes('취침'))) {
        return false;
    }
    
    // **약속이 있으면 무조건 AI 사용**
    const situationContext = { nearbyCharacterNames: [] };
    const relevantMemories = require('./memory.js').retrieveMemories(character, situationContext);
    const hasImportantPlan = relevantMemories.some(memory => 
        memory.type === 'plan' && memory.score > 2.0
    );
    
    if (hasImportantPlan) {
        console.log(`[강제 AI 모드] ${character.name} - 중요한 약속이 있어 AI 모드로 전환`);
        return true;
    }
    const isEssential = schedule && (schedule.status.includes('근무') || schedule.status.includes('공부') || schedule.status.includes('영업'));
    const isFreeTime = schedule && (schedule.status.includes('휴식') || schedule.status.includes('자유 시간'));

    let aiProbability = 0.05; // 기본 확률
    if (isEssential) {
        aiProbability = 0.03;
    } else if (isFreeTime) {
        aiProbability = 0.85;
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

// [핵심] 이제 이 파일의 유일한 목표는 'think' 함수입니다.
// 캐릭터 한 명과 현재 월드 정보를 받아, 다음에 할 행동 계획 하나를 반환합니다.
async function think(character, world) {
    // 1. AI를 사용할지, 정해진 스케줄대로 행동할지 결정합니다.
    if (!shouldUseAI(character, world)) {
        const scriptAction = processWithScript(character, world.situation);
        return { actionName: 'script', ...scriptAction };
    }

    // 2. (AI 사용 결정) LLM에게 보낼 프롬프트를 생성합니다. (기존 think 함수의 로직)
    const { situation, characterDatabase, activeConversations } = world;
    const nearbyCharacters = Object.values(characterDatabase).filter(c => c.id !== character.id && c.location === character.location);
    const situationContext = { nearbyCharacterNames: nearbyCharacters.map(c => c.name) };
    const relevantMemories = retrieveMemories(character, situationContext);

    // 디버깅용 로그 추가
    console.log(`[기억 검색] ${character.name} - 총 ${character.journal?.length || 0}개 기억 중 ${relevantMemories.length}개 추출`);
    relevantMemories.forEach((memory, index) => {
        console.log(`  ${index + 1}. [${memory.type || 'unknown'}] ${memory.description} (점수: ${memory.score?.toFixed(2)})`);
    });

    const memoryContext = relevantMemories.length > 0
        ? `[당신이 현재 상황과 관련하여 떠올린 기억들 (중요도와 최신순)]\n` + relevantMemories.map(m => `- ${m.description} (중요도: ${m.poignancy})`).join('\n')
        : '[현재 특별히 떠오르는 기억이 없습니다.]';
    const timeContext = `현재 시간: Day ${situation.day}, ${situation.currentHour}:${situation.currentMinute.toString().padStart(2, '0')}`;
    const nearbyContext = `주변 인물: ${nearbyCharacters.map(c => c.name).join(', ') || '없음'}`;
    const allCharactersContext = `[월드에 있는 모든 캐릭터 목록]\n` + Object.values(characterDatabase).map(c => `- ${c.name} (현재 위치: ${c.location})`).join('\n');
    const locationNames = Object.keys(locations).join(', ');
    const currentConversation = activeConversations.find(conv => conv.id === character.conversationId);
    
    let prompt;

    // 약속 관련 추가 로그
    const todayPlans = relevantMemories.filter(m => m.type === 'plan');
    if (todayPlans.length > 0) {
        console.log(`[약속 인식] ${character.name}의 오늘 약속:`);
        todayPlans.forEach(plan => {
            const planDesc = plan.description;
            console.log(`  - ${planDesc} (점수: ${plan.score?.toFixed(2)})`);
        });
    }

    if (currentConversation) {
        // --- 대화 중일 때의 프롬프트 ---
        const otherParticipantNames = currentConversation.participants
            .filter(pId => pId !== character.id)
            .map(pId => characterDatabase[pId]?.name || '??');
        
        const conversationLog = currentConversation.log
            .map(entry => `${characterDatabase[entry.speaker]?.name || '???'}: "${entry.content}"`)
            .join('\n');

        prompt = `당신은 '${character.name}'입니다. 당신은 지금 [${otherParticipantNames.join(', ')}]와(과) 대화하고 있습니다.

[대화 기록]
${conversationLog}

[당신의 임무]
당신의 역할과 대화의 흐름을 고려하여 다음 할 말을 결정하세요.
만약 작별 인사를 하거나 대화를 끝내고 싶다면, 반드시 'leaveConversation' 액션을 사용해야 합니다.

[출력 형식]
- 대화를 계속 이어갈 경우:
{ "thoughts": "...", "actionName": "continueConversation", "content": "대화 내용", "nextSpeaker": "다음 발언자 이름" }

- 대화를 완전히 끝낼 경우:
{ "thoughts": "...", "actionName": "leaveConversation", "content": "작별 인사" }`;

    } else {
        prompt = `당신은 '${character.name}'입니다. 당신의 성격, 현재 감정 상태, 그리고 떠오른 기억들을 바탕으로 다음에 무엇을 할지 결정하세요.

[당신의 프로필]
- 성격: ${character.personality}
- 역할: ${character.role}

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

[행동 규칙]
- 당신의 역할과 성격은 모든 행동의 최우선 기준입니다.
- **중요: 약속이 있다면 반드시 약속을 지켜야 합니다. 약속 시간이 되면 다른 모든 활동을 중단하고 약속 장소로 이동해야 합니다.**
- 약속 장소로 이동할 때는 반드시 "targetLocation"에 약속 장소를 지정하세요.
- 당신의 모든 행동은 당신의 성격과 현재 상태(에너지, 스트레스, 사회적 욕구)에 큰 영향을 받습니다. 예를 들어, 스트레스가 높고 에너지가 낮다면 중요한 약속도 취소하거나 미루고 싶을 수 있습니다.
- 당신의 현재 기분과 상태를 행동과 대화에 자연스럽게 드러내세요. 예를 들어, 에너지가 낮다면 "(피곤한 목소리로) 안녕..."과 같이 말할 수 있습니다.
- 대화는 영원히 지속될 수 없습니다. 할 말이 떨어졌거나, 다른 할 일이 생각났거나, 대화가 충분히 길어졌다고 판단되면 "leaveConversation" 액션을 사용해 자연스럽게 대화를 마무리하세요.
- 당신의 이름은 '${character.name}'입니다. 절대로 자기 자신에게 말을 걸거나 메시지를 보내지 마세요.
- 혼잣말을 하고 싶을 때는 반드시 "actionName": "talkToSelf"를 사용하세요.
- 이동하거나 약속 장소를 정할 때는, 반드시 [선택 가능한 장소 목록]에 있는 이름만 사용해야 합니다.

[출력 형식 규칙]
{
  "thoughts": "당신의 생각의 흐름을 적으세요.",
  "actionName": "startConversation | sendMessage | talkToSelf | script 등...",
  "content": "첫 대화 내용 또는 행동에 대한 묘사",
  "target": ["대상이 있다면 이름"],
  "targetLocation": "이동할 장소 이름"
}`;
    }

    // 3. LLM을 호출하고, 생각의 결과물(행동 계획서)을 반환합니다.
    try {
        const rawResponse = await callLLM(prompt, world.llmConfigs[character.id]?.provider);
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { thoughts: "AI 응답에서 JSON을 찾지 못함", actionName: "talkToSelf", content: "(JSON 파싱 오류)" };
    } catch (error) {
        return { thoughts: "AI 호출 중 오류 발생: " + error.message, actionName: "talkToSelf", content: "(AI 호출 오류)" };
    }
}





// // --- 에이전트 실행기 ---

// async function runAgent(character, worldState) {
//     const { situation, llmConfigs, activeConversations, characterDatabase } = worldState;

//     if (situation.currentHour === 0 && situation.currentMinute < 30 && !character.reflectedOnDay) {
//         await reflectOnMemories(character, llmConfigs[character.id]?.provider);
//         await createDailyPlan(character, llmConfigs[character.id]?.provider);
//         character.reflectedOnDay = situation.day;
//     }

//     const currentConv = activeConversations.find(c => c.id === character.conversationId);

//     if (currentConv) {
//     if (currentConv.turnHolder === character.id) {
//         const decision = await think(character, situation, llmConfigs[character.id]?.provider, activeConversations, characterDatabase);
        
//         // ⭐ --- 핵심 수정: AI 결정 검증 및 보정 (안전장치 개선) ---
//         if (decision.actionName === 'continueConversation') {
//             const nextSpeakerName = decision.nextSpeaker;
//             // AI가 다음 발언자를 명확히 지목한 경우에만 검증 로직을 실행합니다.
//             if (nextSpeakerName) {
//                 const nextSpeaker = Object.values(characterDatabase).find(c => c.name === nextSpeakerName);
//                 if (!nextSpeaker || !currentConv.participants.includes(nextSpeaker.id)) {
//                     console.log(`[AI 결정 보정] ${character.name}가 없는 사람(${nextSpeakerName})을 지목하여 발언자를 수정합니다.`);
//                     const otherParticipants = currentConv.participants.filter(pId => pId !== character.id);
//                     if (otherParticipants.length > 0) {
//                         decision.nextSpeaker = characterDatabase[otherParticipants[0]].name;
//                     } else {
//                         decision.actionName = 'leaveConversation';
//                         decision.content = "(모두가 떠나 대화를 마쳤다.)";
//                     }
//                 }
//             }
//         }
//         return decision;
//         } else {
//             return {
//                 actionName: 'listen',
//                 content: `${currentConv.participants.map(pId=>characterDatabase[pId]?.name).join(', ')}의 대화를 듣고 있습니다.`
//             };
//         }
//     }
    
//     if (shouldUseAI(character, { ...situation, characterDatabase })) {
//         const plan = await makePlan(character, situation, llmConfigs[character.id]?.provider, activeConversations, characterDatabase);
//         return plan;
//         } else {
//         const scriptPlan = processWithScript(character, situation);
//         return {
//             actionName: 'script',
//             location: scriptPlan.location,
//             status: scriptPlan.status,
//             content: scriptPlan.content,
//             thoughts: scriptPlan.thoughts
//         };
//     }
// }

// async function makePlan(character, situation, provider, activeConversations, characterDatabase) {
//     // 1-3분 단위로만 새 계획 수립
//     const currentTimeMinutes = situation.day * 24 * 60 + situation.currentHour * 60 + situation.currentMinute;
    
//     if (character.currentPlan && currentTimeMinutes < character.planEndTime) {
//         return character.currentPlan; // 기존 계획 유지
//     }
    
//     // AI가 다음 몇 분간 무엇을 할지 계획
//     // 현재 상황을 더 자세히 분석
//     const currentConv = activeConversations.find(c => c.participants.includes(character.id));
//     const isInConversation = !!currentConv;
//     const nearbyConversations = activeConversations.filter(c => {
//         return c.participants.some(pId => {
//             const participant = characterDatabase[pId];
//             return participant && participant.location === character.location && pId !== character.id;
//         });
//     });

//     console.log(`[상황 분석] ${character.name} - 대화중: ${isInConversation}, 주변 대화: ${nearbyConversations.length}개`);

//     // AI가 다음 몇 분간 무엇을 할지 계획
//     const decision = await think(character, situation, provider, activeConversations, characterDatabase);
    
//     // 계획 지속 시간 설정 (1-3분)
//     const planDuration = Math.floor(Math.random() * 3) + 1;
    
//     character.currentPlan = decision;
//     character.planEndTime = currentTimeMinutes + planDuration;
//     character.lastPlanTime = currentTimeMinutes;
    
//     console.log(`[계획 수립] ${character.name} - ${planDuration}분간: ${decision.actionName}`);
    
//     return decision;
// }

// module.exports = { 
//     makePlan,
//     runAgent, 
//     think, 
//     shouldUseAI, 
//     applySchedule, 
//     getRelationshipContext, 
//     processWithScript,
//     reflectOnMemories,
//     createDailyPlan
// };

// 이제 이 파일은 think 함수만 외부에 공개합니다.
module.exports = { think };