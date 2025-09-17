// 📍 planning.js

const { callLLM } = require('./llm.js');
const { locations } = require('./scenarios.js');

async function createPlanFromConversation(conversation, characterDatabase, provider, situation) {
    // ⭐ 오류 수정: 누락되었던 conversationLog와 participantNames 변수 선언을 다시 추가합니다.
    const conversationLog = conversation.log
        .map(entry => `${characterDatabase[entry.speaker]?.name || '???'}: "${entry.content}"`)
        .join('\n');
    const participantNames = conversation.participants.map(pId => characterDatabase[pId]?.name);
    
    const locationNames = Object.keys(locations).join(', ');

    const prompt = `아래는 '${participantNames.join(', ')}' 사이의 대화 내용입니다.
이 대화에서 구체적인 '약속'(만날 날짜, 시간, 장소, 활동)이 정해졌는지 분석하세요.

[현재 시간 정보]
Day ${situation.day}, ${situation.currentHour}:${situation.currentMinute}

[대화 내용]
${conversationLog}

[선택 가능한 장소 목록]
${locationNames}

[임무]
1. 만약 구체적인 약속이 정해졌다면, 아래 JSON 형식으로 정보를 추출하세요.
2. 약속 장소는 반드시 [선택 가능한 장소 목록]에 있는 이름 중에서만 선택해야 합니다.
3. 이 약속이 얼마나 중요한지 1(가벼운 약속) ~ 10(반드시 지켜야 할 약속) 사이의 점수로 평가하세요.
4. 약속이 없다면, 반드시 "null"이라고만 응답하세요.
[점수 예시]
- 가벼운 제안이나 불확실한 약속: 1-3점
- 구체적인 일반 약속(식사, 수다): 4-6점
- 반드시 지켜야 할 중요한 약속(업무, 마감): 7-10점

[추출 형식]
약속이 있다면: { "day": 숫자, "hour": 숫자, "minute": 숫자, "activity": "활동 내용", "location": "장소 이름", "participants": ["참여자 이름1", ...], "poignancy": 중요도 점수 (숫자) }
약속이 없다면: null`;

    try {
        const rawResponse = await callLLM(prompt, provider);
        if (rawResponse.toLowerCase().includes('null')) return null;

        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const plan = JSON.parse(jsonMatch[0]);
            if (plan.day && plan.hour !== undefined && plan.activity && plan.location && plan.participants && plan.poignancy) {
                const planTime = plan.day * 24 * 60 + plan.hour * 60 + (plan.minute || 0);
                const nowTime = situation.day * 24 * 60 + situation.currentHour * 60 + situation.currentMinute;
                if (planTime > nowTime && plan.day <= situation.day + 2) {
                    plan.minute = plan.minute || 0;
                    // 약속 객체에도 memory와 동일하게 type을 지정해줍니다.
                    plan.type = 'plan'; 
                    return plan;
                }
            }
        }
        return null;
    } catch (error) {
        console.error(`[약속 기록 오류] 대화(${conversation.id}):`, error);
        return null;
    }
}

module.exports = { createPlanFromConversation };