// agent/observe.js 관찰 시스템

function observe(character, world) {
    const observations = {
        currentLocation: character.location,
        currentTime: `Day ${world.situation.day}, ${world.situation.currentHour}:${world.situation.currentMinute}`,
        nearbyCharacters: [],
        ongoingConversations: [],
        myConversation: null,
        myNeeds: {
            energy: character.energy || 100,
            stress: character.stress || 0,
            socialNeed: character.socialNeed || 50
        }
    };

    // 같은 장소에 있는 다른 캐릭터들 찾기
    observations.nearbyCharacters = Object.values(world.characterDatabase)
        .filter(c => c.id !== character.id && c.location === character.location)
        .map(c => ({ id: c.id, name: c.name, status: c.status }));

    // 진행 중인 대화 확인
    observations.ongoingConversations = world.activeConversations
        .filter(conv => conv.isActive)
        .map(conv => ({
            id: conv.id,
            participants: conv.participants.map(pId => world.characterDatabase[pId]?.name),
            location: world.characterDatabase[conv.participants[0]]?.location
        }));

    // 내가 참여 중인 대화 확인
    observations.myConversation = world.activeConversations
        .find(conv => conv.participants.includes(character.id));

    console.log(`[관찰] ${character.name} - 주변 ${observations.nearbyCharacters.length}명, 대화 ${observations.ongoingConversations.length}개`);
    
    return observations;
}

function buildContext(character, observations) {
    return {
        nearbyCharacterNames: observations.nearbyCharacters.map(c => c.name),
        isInConversation: !!observations.myConversation,
        hasNearbyConversations: observations.ongoingConversations.length > 0,
        needsAttention: observations.myNeeds.energy < 30 || observations.myNeeds.stress > 70
    };
}

module.exports = { observe, buildContext };