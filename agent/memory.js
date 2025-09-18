// 📍 memory.js

const { callLLM } = require('../utils/llm.js');
const { truncateText } = require('../utils/logger.js');

function retrieveMemories(character, situationContext) {
    if (!character.journal || character.journal.length === 0) {
        return [];
    }

    const scoredMemories = character.journal.map(memory => {
        const recency = calculateRecencyScore(memory);
        const importance = calculateImportanceScore(memory);
        const relevance = calculateRelevanceScore(memory, situationContext);

        // ⭐ 최종 점수는 세 점수의 합으로 결정 (AI Town의 단순화된 버전)
        const totalScore = recency + importance + relevance;
        
        return { ...memory, score: totalScore, scores: { recency, importance, relevance } };
    });

    // 점수가 높은 순으로 정렬
    scoredMemories.sort((a, b) => b.score - a.score);
    
    // 상위 10개의 기억만 반환
    return scoredMemories.slice(0, 5);
}

async function searchRelevantMemories(character, currentContext, provider) {
    // 1. 전체 기억에서 일차 필터링 (기존 방식)
    const candidateMemories = retrieveMemories(character, currentContext);
    
    if (candidateMemories.length === 0) {
        console.log(`[기억 검색] ${character.name} - 후보 기억 없음`);
        return [];
    }
    
    console.log(`[기억 검색] ${character.name} - 후보 기억 ${candidateMemories.length}개:`);
    candidateMemories.forEach((m, i) => {
        const truncatedDesc = truncateText(m.description || m.activity);
        console.log(`  ${i+1}. ${truncatedDesc} (점수: ${m.score?.toFixed(2)})`);
    });

    // 2. LLM을 통한 관련성 평가
    const memoryList = candidateMemories.map((m, index) => 
        `${index + 1}. ${m.description}`
    ).join('\n');
    
    const contextDescription = `${character.name}이(가) ${currentContext.nearbyCharacterNames.join(', ')}와 상호작용하려고 함`;
    
    const prompt = `현재 상황: "${contextDescription}"
    
다음은 ${character.name}의 기억 목록입니다:
${memoryList}

현재 상황과 가장 관련이 높은 기억 3개의 번호만 골라주세요.
관련성이 낮은 기억들은 제외하세요.

응답 형식: [1, 3, 5] (숫자 배열만 출력)`;

    try {
        const response = await callLLM(prompt, provider);
        const arrayMatch = response.match(/\[[\d,\s]+\]/);
        if (arrayMatch) {
            const selectedIndices = JSON.parse(arrayMatch[0]);
            const selectedMemories = selectedIndices.map(i => candidateMemories[i - 1]).filter(Boolean);
            console.log(`[기억 검색] ${character.name} - ${candidateMemories.length}개 중 ${selectedMemories.length}개 선택`);
            console.log(` ${character.name} - 최종 선택된 기억:`);
            selectedMemories.forEach(m => {
                const truncatedDesc = truncateText(m.description || m.activity);
                console.log(`  - ${truncatedDesc}`);
            });
            return selectedMemories;
        }
        return candidateMemories.slice(0, 3); // 파싱 실패시 기존 방식
    } catch (error) {
        console.error(`[기억 검색 오류] ${character.name}:`, error);
        return candidateMemories.slice(0, 3); // 실패시 기존 방식
    }
}

async function createMemoryFromConversation(character, conversation, characterDatabase, provider) {
    const conversationLog = conversation.log
        .map(entry => `${characterDatabase[entry.speaker]?.name || '???'}: "${entry.content}"`)
        .join('\n');
    const ph = conversation.participantHistory || conversation.participants || [];
    const participantNames = ph.map(pId => characterDatabase[pId]?.name).filter(n => n && n !== character.name);

    const prompt = `당신은 '${character.name}'입니다. 방금 '${participantNames.join(', ')}'와(과) 나눈 대화는 다음과 같습니다.

    [대화 내용]
    ${conversationLog}

    [당신의 임무]
    1. 위 대화에서 당신이 얻은 핵심적인 정보나 느낀 감정을 한 문장으로 요약하세요.
    2. 이 대화가 당신에게 얼마나 중요하거나 감정적으로 강렬했는지 1(사소함) ~ 10(매우 중요함) 사이의 점수로 평가하세요.
    [점수 예시]
    - 일상적인 안부나 잡담: 1-3점
    - 새로운 정보나 계획에 대한 논의: 4-6점
    - 감정적인 교류나 중요한 결정, 갈등: 7-10점

    [출력 형식]
    반드시 아래와 같은 JSON 형식으로만 응답해야 합니다.
    {
    "summary": "대화에 대한 한 문장 요약",
    "poignancy": 중요도 점수 (숫자)
    }`;

    try {
        const rawResponse = await callLLM(prompt, provider);
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            const newMemory = {
                timestamp: new Date().toISOString(),
                description: result.summary,
                poignancy: result.poignancy,
                type: 'conversation',
                participants: conversation.participantHistory.map(id => characterDatabase[id]?.name).filter(Boolean),
                conversationId: conversation.id
            };
            console.log(`[기억 생성 확인] ${character.name} - description: "${newMemory.description}", poignancy: ${newMemory.poignancy}`);
            return newMemory; // 이제 생성된 기억 '객체'만 반환합니다.
        }
        console.error(`[기억 생성 오류] ${character.name}: 대화(${conversation.id})에서 유효한 JSON 응답을 받지 못했습니다.`);
        return null;
    } catch (error) {
        console.error(`[기억 생성 오류] ${character.name}:`, error);
        return null;
    }
}

// --- 기억 검색 시스템 (AI Town 방식 적용) ---

// ⭐ 1. 최신성 점수 계산: 과거 기억과 미래 약속을 모두 처리하도록 개선합니다.
function calculateRecencyScore(memory) {
    const now = new Date();
    const memoryTime = new Date(memory.timestamp);
    const timeDiffHours = (memoryTime - now) / (1000 * 60 * 60);

    // 기억의 종류에 따라 점수 계산 방식을 다르게 적용합니다.
    if (memory.type === 'plan' && timeDiffHours > 0) {
        // [미래의 약속] 약속 시간이 가까워질수록 점수가 1에 가까워집니다.
        // (예: 24시간 전 = 0.78, 1시간 전 = 0.99)
        
        const score = Math.pow(0.99, timeDiffHours);
        console.log(`[약속 점수] "${memory.description}" - 시간차: ${timeDiffHours.toFixed(1)}시간, 점수: ${score.toFixed(3)}`);
        return score;
    } else {
        // [과거의 기억] 생성된 지 오래될수록 점수가 0에 가까워집니다.
        const hoursAgo = Math.abs(timeDiffHours);
        return Math.pow(0.5, hoursAgo); // 0.99 → 0.5로 변경
    }
}

// 2. 중요도 점수 계산: 기억 자체에 저장된 poignancy 값을 사용합니다.
function calculateImportanceScore(memory) {
    return memory.poignancy / 10; // 1~10점 척도를 0.1~1.0으로 정규화
}

// 3. (단순화된) 관련성 점수 계산: 현재 상황과 얼마나 관련 있는지 평가합니다.
function calculateRelevanceScore(memory, situationContext) {
    let score = 0;
    // 🔥 방어 코드 추가
    const textToCheck = memory.description || memory.activity || memory.summary || '';
    if (!textToCheck.trim()) {
        console.warn(`[기억 오류] 텍스트가 없는 기억:`, memory);
        return 0;
    }

    if (situationContext.nearbyCharacterNames) {
        for (const name of situationContext.nearbyCharacterNames) {
            if (textToCheck.includes(name)) {
                score += 0.3;
            }
        }
    }
    
    // 약속 관련성 추가
    if (memory.type === 'plan') {
        score += 0.5; // 약속은 기본적으로 관련성이 높음
         console.log(`[관련성] 약속 "${memory.description || memory.activity || '내용없음'}" - 점수: ${score}`);
    }
    
    return Math.min(1.0, score);
}

/**
 * AI Town의 기억 검색 방식을 적용하여, 캐릭터의 기억 중 가장 중요한 기억들을 추출합니다.
 * @param {object} character - 기억을 검색할 캐릭터
 * @param {object} situationContext - 현재 상황 정보 (주변 인물 등)
 * @returns {Array<object>} 점수가 높은 상위 기억들의 배열
 */


module.exports = { 
    retrieveMemories,
    createMemoryFromConversation,
    searchRelevantMemories
};