// simulation/relationships.js - 확장된 관계 시스템

const { updateRelationshipDefinition } = require('../agent/relationshipAnalysis.js');

/**
 * 대화 기록을 바탕으로 두 캐릭터 간의 관계 변화를 추론합니다.
 * 이제 AI가 직접 관계를 정의하는 방식으로 변경되었습니다.
 * @param {object} characterA - 평가 주체 캐릭터
 * @param {object} characterB - 평가 대상 캐릭터
 * @param {object} conversation - 종료된 대화 객체
 * @param {object} characterDatabase - 전체 캐릭터 데이터베이스
 * @param {string} provider - 사용할 LLM provider
 * @returns {Promise<object|null>} - 관계 분석 결과
 */
async function updateRelationshipFromConversation(characterA, characterB, conversation, characterDatabase, provider) {
    try {
        // 새로운 AI 기반 관계 분석 시스템 사용
        const analysisResult = await updateRelationshipDefinition(
            characterA, 
            characterB, 
            conversation, 
            characterDatabase, 
            provider
        );
        
        if (analysisResult) {
            console.log(`[관계 업데이트 완료] ${characterA.name} → ${characterB.name}`);
            console.log(`  새로운 관계 정의: "${analysisResult.relationshipType}"`);
            return analysisResult;
        }
        
        return null;
        
    } catch (error) {
        console.error(`[관계 업데이트 오류] ${characterA.name} → ${characterB.name}:`, error);
        return null;
    }
}

/**
 * 관계의 전체적인 건강도를 평가합니다.
 * @param {object} relationship - 평가할 관계 객체
 * @returns {object} - 관계 건강도 정보
 */
function evaluateRelationshipHealth(relationship) {
    const { affection, trust, respect, familiarity } = relationship;
    
    // 전체 점수 계산 (가중 평균)
    const overallScore = (affection * 0.3 + trust * 0.3 + respect * 0.2 + familiarity * 0.2);
    
    let healthLevel = '';
    if (overallScore >= 80) healthLevel = '매우 좋음';
    else if (overallScore >= 60) healthLevel = '좋음';
    else if (overallScore >= 40) healthLevel = '보통';
    else if (overallScore >= 20) healthLevel = '나쁨';
    else healthLevel = '매우 나쁨';
    
    // 관계의 특성 분석
    let characteristics = [];
    if (trust > 80) characteristics.push('신뢰함');
    if (respect > 80) characteristics.push('존경함');
    if (affection > 80) characteristics.push('매우 좋아함');
    if (familiarity > 80) characteristics.push('매우 친함');
    
    if (trust < 30) characteristics.push('불신함');
    if (affection < 30) characteristics.push('싫어함');
    if (familiarity < 20) characteristics.push('어색함');
    
    return {
        overallScore: Math.round(overallScore),
        healthLevel,
        characteristics,
        strengths: characteristics.filter(c => !c.includes('불') && !c.includes('싫') && !c.includes('어색')),
        weaknesses: characteristics.filter(c => c.includes('불') || c.includes('싫') || c.includes('어색'))
    };
}

/**
 * 두 캐릭터 간의 관계 호환성을 분석합니다.
 * @param {object} relationshipAB - A가 B를 보는 관계
 * @param {object} relationshipBA - B가 A를 보는 관계
 * @returns {object} - 관계 호환성 분석 결과
 */
function analyzeRelationshipCompatibility(relationshipAB, relationshipBA) {
    if (!relationshipAB || !relationshipBA) return null;
    
    // 상호 관계 점수 차이 계산
    const affectionGap = Math.abs(relationshipAB.affection - relationshipBA.affection);
    const trustGap = Math.abs(relationshipAB.trust - relationshipBA.trust);
    const respectGap = Math.abs(relationshipAB.respect - relationshipBA.respect);
    
    // 평균 격차
    const averageGap = (affectionGap + trustGap + respectGap) / 3;
    
    let compatibility = '';
    if (averageGap < 20) compatibility = '매우 조화로움';
    else if (averageGap < 40) compatibility = '조화로움';
    else if (averageGap < 60) compatibility = '불균형';
    else compatibility = '매우 불균형';
    
    // 관계 패턴 분석
    let pattern = '';
    if (relationshipAB.affection > relationshipBA.affection + 30) {
        pattern = 'A가 B를 더 좋아함';
    } else if (relationshipBA.affection > relationshipAB.affection + 30) {
        pattern = 'B가 A를 더 좋아함';
    } else {
        pattern = '상호 균형적';
    }
    
    return {
        compatibility,
        averageGap: Math.round(averageGap),
        pattern,
        affectionGap,
        trustGap,
        respectGap
    };
}

/**
 * 관계 기록을 정리하고 오래된 기록을 압축합니다.
 * @param {object} relationship - 정리할 관계 객체
 */
function cleanupRelationshipHistory(relationship) {
    // 오래된 공유 경험 압축 (30개 초과 시)
    if (relationship.sharedExperiences.length > 30) {
        relationship.sharedExperiences = relationship.sharedExperiences.slice(-30);
    }
    
    // 중요한 사건들도 10개로 제한
    if (relationship.significantEvents.length > 10) {
        // 중요도가 높은 순으로 정렬 후 상위 10개만 보관
        relationship.significantEvents.sort((a, b) => {
            const scoreA = a.type === '긍정적' ? 2 : a.type === '부정적' ? 3 : 1;
            const scoreB = b.type === '긍정적' ? 2 : b.type === '부정적' ? 3 : 1;
            return scoreB - scoreA;
        });
        relationship.significantEvents = relationship.significantEvents.slice(0, 10);
    }
}

module.exports = {
    updateRelationshipFromConversation,
    evaluateRelationshipHealth,
    analyzeRelationshipCompatibility,
    cleanupRelationshipHistory,
};