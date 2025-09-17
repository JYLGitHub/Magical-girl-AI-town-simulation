// =======================================================================
// [1] 전역 상태 변수 (Global State)
// =======================================================================
let gameState = {
    isRunning: false,
    currentTime: 8,
    currentMinute: 0,
    day: 1,
    llmConfigs: {},
    aiCallsToday: 0,
    scriptCallsToday: 0,
    llmStats: { gemini: 0, gpt: 0 },
    characters: {},
    mainEvents: []
};
let simulationInterval;

// =======================================================================
// [2] 초기화 및 메인 이벤트 리스너
// =======================================================================

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('startBtn').addEventListener('click', startSimulation);
    document.getElementById('pauseBtn').addEventListener('click', pauseSimulation);
    document.getElementById('resetBtn').addEventListener('click', resetSimulation);
    initializeSimulationData();
});

async function initializeSimulationData() {
    try {
        const response = await fetch('/api/get-initial-data');
        if (!response.ok) throw new Error('서버 응답 오류');
        
        const data = await response.json();
        
        for (const charId in data.characters) {
            const charData = data.characters[charId];
            gameState.characters[charId] = {
                ...charData,
                mood: charData.mood || '평온',
                energy: charData.energy || 100,
                stress: charData.stress || 10,
                socialNeed: charData.socialNeed || 50,
                currentAction: '대기 중...',
                thoughts: '...',
                personalLog: [],
                isExpanded: false,
                actionType: 'script',
                isInConversation: false,
                conversationLockTimer: 0,
                relationships: charData.relationships || {}
            };
        }
        
        updateTimeDisplay();
        updateCharacterCount();
        generateLLMConfigUI();
        updateAIStats();
        updateCharacterCards();

    } catch (error) {
        console.error("초기화 오류:", error);
    }
}

// =======================================================================
// [3] 시뮬레이션 제어
// =======================================================================

let simulationTimeout; // 타이머를 제어하기 위한 변수

function startSimulation() {
    gameState.isRunning = true;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    
    addMainEvent('🚀 시뮬레이션이 시작되었습니다!', 'event');
    
    // 틱을 처리하는 gameLoop를 처음 호출합니다.
    gameLoop();
}

// processTimeStep의 역할을 하는 새로운 함수입니다.
async function gameLoop() {
    // 시뮬레이션이 실행 중일 때만 다음 틱을 진행합니다.
    if (!gameState.isRunning) return;

    await processTimeStep(); // 기존의 시간 처리 로직을 실행

    // 작업이 끝난 후, 5초 뒤에 자기 자신(gameLoop)을 다시 호출하도록 예약합니다.
    simulationTimeout = setTimeout(gameLoop, 5000);
}

function pauseSimulation() {
    gameState.isRunning = false;
    clearTimeout(simulationTimeout); // 예약된 다음 호출을 취소합니다.
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    addMainEvent('⏸️ 시뮬레이션이 일시정지되었습니다.', 'event');
}

async function resetSimulation() {
    if (!confirm('정말로 시뮬레이션을 초기화하시겠습니까? 모든 데이터가 사라집니다.')) {
        return;
    }
    
    pauseSimulation();
    
    try {
        const response = await fetch('/api/reset-simulation', { method: 'POST' });
        if (!response.ok) {
            throw new Error('서버 리셋에 실패했습니다.');
        }
        console.log('서버 데이터 리셋 완료. 페이지를 새로고침합니다.');
        location.reload();
    } catch (error) {
        console.error('리셋 오류:', error);
        alert('리셋 중 오류가 발생했습니다.');
    }
}

// =======================================================================
// [4] 시뮬레이션 코어 로직
// =======================================================================

async function processTimeStep() {
    if (!gameState.isRunning) return;
    
    gameState.currentMinute += 30;
    if (gameState.currentMinute >= 60) {
        gameState.currentMinute = 0;
        gameState.currentTime++;
        if (gameState.currentTime >= 24) {
            gameState.currentTime = 0;
            gameState.day++;
            addMainEvent(`🌅 ${gameState.day}일차 아침이 밝았습니다.`, 'event');
        }
    }
    
    updateTimeDisplay();
    updateAIStats();

    try {
        const characterIds = Object.keys(gameState.characters);
        const situation = {
            day: gameState.day,
            currentHour: gameState.currentTime,
            currentMinute: gameState.currentMinute, // 👈 이 부분이 추가되었습니다.
            allCharacters: Object.values(gameState.characters)
        };

        gameState.llmConfigs = getLLMConfigs();

        const response = await fetch('/api/character-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ characterIds, situation, llmConfigs: gameState.llmConfigs })
        });
        
        if (!response.ok) throw new Error('서버 업데이트 실패');
        
        const { updates } = await response.json();

        for (const charId in updates) {
            const update = updates[charId];
            gameState.characters[charId] = { ...gameState.characters[charId], ...update };
            
            updateStatistics(update.actionType, charId);

            if (update.interactionLog) {
                addInteractionLog(update.interactionLog);
            }
        }

    } catch (error) {
        console.error("타임스텝 처리 오류:", error);
        pauseSimulation();
    }

    updateCharacterCards();
}

// =======================================================================
// [5] UI 렌더링 및 유틸리티
// =======================================================================

function getLLMConfigs() {
    const configs = {};
    Object.keys(gameState.characters).forEach(id => {
        const selectEl = document.getElementById(`${id}LLM`);
        configs[id] = { provider: selectEl ? selectEl.value : 'gemini' };
    });
    return configs;
}

function updateCharacterCards() {
    const grid = document.getElementById('charactersGrid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.values(gameState.characters).forEach(character => {
        grid.appendChild(createCharacterCard(character));
    });
}

function createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = `character-card ${character.isExpanded ? 'expanded' : ''}`;
    
    let actionTypeText = character.actionType === 'script' ? '스크립트' : 'AI';

    // 관계 정보 표시
    let relationshipSummary = '';
    if (character.relationships && Object.keys(character.relationships).length > 0) {
        const relationshipCount = Object.keys(character.relationships).length;
        const avgAffection = Object.values(character.relationships).reduce((sum, rel) => sum + rel.affection, 0) / relationshipCount;
        relationshipSummary = `<div class="relationship-summary">관계: ${relationshipCount}명 (평균 호감도: ${Math.round(avgAffection)})</div>`;
    }

    card.innerHTML = `
        <div class="character-header" onclick="toggleCharacter('${character.id}')">
            <div class="character-avatar">${character.avatar}</div>
            <div class="character-info">
                <div class="character-name">${character.name} <div class="ai-indicator ${character.actionType}"></div></div>
                <div class="character-role">${character.role}</div>
            </div>
            <div class="expand-icon">▼</div>
        </div>
        <div class="character-summary">
             <div class="current-status">
                <span class="location-status">📍 ${character.location}</span>
                <span class="mood-energy">😊 ${character.mood || '평온'} | ⚡ ${Math.round(character.energy || 100)}%</span>
            </div>
            <div class="stress-social">
                <span class="stress-level">😰 스트레스: ${Math.round(character.stress || 0)}%</span>
                <span class="social-need">👥 사회욕구: ${Math.round(character.socialNeed || 0)}%</span>
            </div>
            ${relationshipSummary}
            <div class="current-action-summary">
                ${character.currentAction || "..."}
                <span class="action-type ${character.actionType}">${actionTypeText}</span>
            </div>
        </div>
        <div class="character-details">
            <div class="detail-section">
                <div class="detail-title">현재 상태</div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">기분</div>
                        <div class="stat-value">${character.mood || '평온'}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">에너지</div>
                        <div class="stat-value">${Math.round(character.energy || 100)}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">스트레스</div>
                        <div class="stat-value">${Math.round(character.stress || 0)}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">사회적 욕구</div>
                        <div class="stat-value">${Math.round(character.socialNeed || 0)}%</div>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <div class="detail-title">현재 생각</div>
                <div class="character-thoughts">${character.thoughts || '...'}</div>
            </div>
            
            ${createRelationshipSection(character)}
            
            <div class="detail-section">
                <div class="detail-title">개인 기록</div>
                <div class="personal-log">
                    ${character.personalLog && character.personalLog.length > 0 
                        ? character.personalLog.slice(-5).map(log => 
                            `<div class="log-entry-personal">
                                <span class="log-time">${log.time}</span>${log.content}
                            </div>`
                        ).join('')
                        : '<div class="log-entry-personal">기록이 없습니다.</div>'
                    }
                </div>
            </div>
        </div>`;
    return card;
}

function createRelationshipSection(character) {
    if (!character.relationships || Object.keys(character.relationships).length === 0) {
        return `
            <div class="detail-section">
                <div class="detail-title">인간관계</div>
                <div class="detail-content">아직 형성된 관계가 없습니다.</div>
            </div>`;
    }

    let relationshipHTML = `
        <div class="detail-section">
            <div class="detail-title">인간관계</div>
            <div class="relationships-list">`;

    Object.entries(character.relationships).forEach(([name, rel]) => {
        let relationshipStatus = '';
        if (rel.affection > 70) relationshipStatus = '💕 매우 친함';
        else if (rel.affection > 40) relationshipStatus = '😊 친함';
        else if (rel.affection > 10) relationshipStatus = '🙂 호감';
        else if (rel.affection > -10) relationshipStatus = '😐 보통';
        else relationshipStatus = '😞 불편함';

        relationshipHTML += `
            <div class="relationship-item">
                <div class="relationship-header">
                    <span class="relationship-name">${name}</span>
                    <span class="relationship-status">${relationshipStatus}</span>
                </div>
                <div class="relationship-stats">
                    <small>호감도: ${Math.round(rel.affection)} | 신뢰도: ${Math.round(rel.trust)} | 친밀도: ${Math.round(rel.familiarity)}</small>
                </div>
                <div class="relationship-stats">
                    <small>대화 횟수: ${rel.interactionCount}회</small>
                </div>
                ${rel.memories && rel.memories.length > 0 ? 
                    `<div class="relationship-memories">
                        <small>최근 기억: ${rel.memories.slice(-2).join(', ')}</small>
                    </div>` : ''
                }
            </div>`;
    });

    relationshipHTML += `
            </div>
        </div>`;

    return relationshipHTML;
}

function toggleCharacter(characterId) {
    const character = gameState.characters[characterId];
    if (character) {
        character.isExpanded = !character.isExpanded;
        updateCharacterCards();
    }
}

function generateLLMConfigUI() {
    const container = document.getElementById('characterLLMGrid');
    if (!container) return;
    container.innerHTML = ''; 
    Object.values(gameState.characters).forEach(character => {
        const selectWrapper = document.createElement('div');
        // ⭐ 수정: div에 CSS 클래스를 추가하여 스타일 관리를 용이하게 합니다.
        selectWrapper.className = 'llm-config-item'; 
        
        // ⭐ 수정: gemini를 제거하고 Gemini를 추가하며, Gemini를 기본 선택으로 설정합니다.
        // UI도 더 명확하게 라벨과 select로 분리합니다.
        selectWrapper.innerHTML = `
            <label for="${character.id}LLM">${character.name}</label>
            <select id="${character.id}LLM">
                <option value="gemini" selected>Gemini</option>
                <option value="gpt">GPT</option>
            </select>`;
        container.appendChild(selectWrapper);
    });
}

function updateTimeDisplay() {
    const timeDisplay = document.getElementById('timeDisplay');
    if (!timeDisplay) return;
    const h = gameState.currentTime;
    const m = gameState.currentMinute.toString().padStart(2, '0');
    timeDisplay.textContent = `시간: ${h}:${m} (${gameState.day}일차)`;
}

function addMainEvent(message, type) {
    const timeStr = `${gameState.currentTime.toString().padStart(2, '0')}:${gameState.currentMinute.toString().padStart(2, '0')}`;
    gameState.mainEvents.unshift({ time: timeStr, content: message, type });
    if (gameState.mainEvents.length > 50) gameState.mainEvents.pop();
    updateMainLog();
}

function addInteractionLog(log) {
    let message = '';
    let icon = '🤔';

    if (log.from && log.to) {
        if (log.action.includes('대화 참여')) {
            icon = '🙋';
            message = `${icon} <strong>${log.from}</strong> → <strong>'${log.to}'</strong>: ${log.action}`;
        } else if (log.type === 'conversation' && log.to !== '대화') {
            icon = '💬';
            message = `${icon} <strong>${log.from}</strong> → <strong>${log.to}</strong>: ${log.action}`;
        } else {
            icon = '🗣️';
            message = `${icon} <strong>${log.from}</strong>: ${log.action}`;
        }
    }

    if (log.thoughts) {
        message += `<br><blockquote><small><em>(속마음: ${log.thoughts})</em></small></blockquote>`;
    }
    
    // 유효한 메시지가 있을 때만 로그에 추가합니다.
    if (message) {
        addMainEvent(message, 'conversation');
    }
}

function updateMainLog() {
    const mainLog = document.getElementById('mainLog');
    if (!mainLog) return;
    mainLog.innerHTML = gameState.mainEvents.map(event => `
        <div class="log-entry ${event.type}">
            <div class="log-timestamp">${event.time}</div>
            <div class="log-content">${event.content}</div>
        </div>
    `).join('') || '<div>이벤트가 없습니다.</div>';
}

function updateCharacterCount() {
    const charCount = document.getElementById('characterCount');
    if (charCount) charCount.textContent = `(${Object.keys(gameState.characters).length}명)`;
}

function updateStatistics(actionType, characterId) {
    if (!gameState.llmStats) gameState.llmStats = { gemini: 0, gpt: 0 };
    if (actionType && actionType.includes('ai')) {
        gameState.aiCallsToday = (gameState.aiCallsToday || 0) + 1;
        const provider = gameState.llmConfigs[characterId]?.provider || 'gemini';
        gameState.llmStats[provider] = (gameState.llmStats[provider] || 0) + 1;
    } else {
        gameState.scriptCallsToday = (gameState.scriptCallsToday || 0) + 1;
    }
}

function updateAIStats() {
    const aiStatsDisplay = document.getElementById('aiStats');
    if (!aiStatsDisplay) return;
    const geminiCalls = gameState.llmStats?.gemini || 0;
    const gptCalls = gameState.llmStats?.gpt || 0;
    const totalAI = geminiCalls + gptCalls;
    const scriptCalls = gameState.scriptCallsToday || 0;
    aiStatsDisplay.innerHTML = `오늘 AI: ${totalAI}회 (C: ${geminiCalls}, G: ${gptCalls}) | 스크립트: ${scriptCalls}회`;
}