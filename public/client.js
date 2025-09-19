// =======================================================================
// [1] 전역 상태 변수 (Global State)
// =======================================================================
let gameState = {
    isRunning: false, // UI 업데이트를 계속할지 여부만 제어
    llmConfigs: {},
    characters: {},
    mainEvents: []
};
let uiUpdateInterval;

// =======================================================================
// [2] 초기화 및 메인 이벤트 리스너
// =======================================================================
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('startBtn').addEventListener('click', startSimulation);
    document.getElementById('pauseBtn').addEventListener('click', pauseSimulation);
    document.getElementById('resetBtn').addEventListener('click', resetSimulation);
    // initializeSimulationData();

    // [수정] 이제 초기화와 주기적 업데이트를 한 함수에서 관리합니다.
    // 페이지가 로드되면 일단 한 번 상태를 가져오고,
    fetchAndUpdate();
    // 그 후 5초마다 주기적으로 상태를 가져옵니다.
    setInterval(fetchAndUpdate, 5000);
});

// [수정] initializeSimulationData, gameLoop, processTimeStep 함수를 모두 이 함수로 통합합니다.
async function fetchAndUpdate() {
    // 초기 로드는 항상 허용, 이후에는 isRunning 상태 확인
    if (!gameState.isRunning && gameState.initialized) {
        return;
    }

    try {
        // [수정] 이제 오직 '/api/get-world-state' API만 호출합니다.
        const response = await fetch('/api/get-world-state');
        if (!response.ok) throw new Error('서버 응답 오류');
        
        const serverWorld = await response.json();
        
        // [수정] 서버에서 받은 최신 데이터로 클라이언트의 gameState 전체를 업데이트합니다.
        // 캐릭터 데이터 업데이트
        for (const charId in serverWorld.characters) {
            // 기존에 있던 isExpanded 같은 클라이언트 전용 상태는 유지하면서 업데이트
            const localChar = gameState.characters[charId] || {};
            gameState.characters[charId] = {
                ...serverWorld.characters[charId],
                isExpanded: localChar.isExpanded || false, 
            };
        }
        
        // 시간 및 기타 정보 업데이트
        gameState.day = serverWorld.situation.day;
        gameState.currentTime = serverWorld.situation.currentHour;
        gameState.currentMinute = serverWorld.situation.currentMinute;
        
        // 화면을 새로 그립니다.
        updateTimeDisplay();
        updateCharacterCount();
        generateLLMConfigUI(); // 이 부분은 한 번만 실행되도록 수정할 수도 있습니다.
        updateAIStats();
        updateCharacterCards();
        // [추가] 서버에서 받은 이벤트 로그를 화면에 표시합니다.
        // (이를 위해선 서버의 world 객체에 mainEvents 배열이 있어야 합니다)
        if (serverWorld.mainEvents) {
            gameState.mainEvents = serverWorld.mainEvents;
            updateMainLog();
        }
        // 첫 번째 로드 완료 표시
        gameState.initialized = true;
    } catch (error) {
        console.error("월드 상태 업데이트 오류:", error);
    }
}

// =======================================================================
// [3] 시뮬레이션 제어 
// =======================================================================
async function startSimulation() {
    try {
        const response = await fetch('/api/start-simulation', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            gameState.isRunning = true;
            document.getElementById('startBtn').disabled = true;
            document.getElementById('pauseBtn').disabled = false;
            document.getElementById('simulationStatus').textContent = '실행 중';
            addMainEvent('🚀 시뮬레이션을 시작합니다!', 'event');
        }
    } catch (error) {
        console.error('시뮬레이션 시작 오류:', error);
    }
}
 
async function pauseSimulation() {
    try {
        const response = await fetch('/api/stop-simulation', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            gameState.isRunning = false;
            document.getElementById('startBtn').disabled = false;
            document.getElementById('pauseBtn').disabled = true;
            document.getElementById('simulationStatus').textContent = '일시정지';
            addMainEvent('⏸️ 시뮬레이션을 일시정지합니다.', 'event');
        }
    } catch (error) {
        console.error('시뮬레이션 정지 오류:', error);
    }
}

async function resetSimulation() {
    if (!confirm('정말로 시뮬레이션을 초기화하시겠습니까? 모든 데이터가 사라집니다.')) return;
    
    pauseSimulation();
    
    try {
        const response = await fetch('/api/reset-simulation', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(data.message);
            location.reload(); // 페이지 새로고침으로 초기화
        } else {
            console.error('리셋 실패');
        }
    } catch (error) {
        console.error('리셋 오류:', error);
    }
}

// =======================================================================
// [4] 서버 데이터 요청 및 UI 업데이트 핵심 로직
// =======================================================================
async function fetchWorldStateAndUpdateUI() {
    if (!gameState.isRunning) return;

    try {
        const response = await fetch('/api/get-world-state');
        if (!response.ok) throw new Error('서버 상태 가져오기 실패');
        const serverWorld = await response.json();
        
        // [핵심 수정] 데이터를 통째로 덮어쓰는 대신, 캐릭터별로 업데이트합니다.
        for (const charId in serverWorld.characters) {
            const serverChar = serverWorld.characters[charId];
            if (gameState.characters[charId]) {
                // 기존 캐릭터 정보에 서버에서 받은 최신 정보를 합칩니다.
                // 이렇게 하면 isExpanded 같은 클라이언트 상태가 유지됩니다.
                Object.assign(gameState.characters[charId], serverChar);
            } else {
                // 시뮬레이션 도중 새로 추가된 캐릭터 처리
                gameState.characters[charId] = { ...serverChar, isExpanded: false };
            }
        }

        // 서버에서 받은 최신 데이터로 클라이언트의 gameState를 덮어씁니다.
        gameState.situation = serverWorld.situation;
        // [수정] mainEvents가 없을 경우를 대비합니다.
        gameState.mainEvents = serverWorld.mainEvents || [];

        // 화면을 새로 그립니다.
        updateAllUI();

    } catch (error) {
        console.error("월드 상태 업데이트 오류:", error);
        pauseSimulation(); // 오류 발생 시 업데이트 중지
    }
}

function updateAllUI() {
    updateTimeDisplay();
    updateCharacterCards();
    // updateMainLog(); // mainLog는 아직 서버에서 오지 않으므로 추후 추가
}

// =======================================================================
// [5] UI 렌더링 및 유틸리티
// =======================================================================
function updateTimeDisplay() {
    if (!gameState.situation) return;
    const { day, currentHour, currentMinute } = gameState.situation;
    const timeDisplay = document.getElementById('timeDisplay');
    if (!timeDisplay) return;
    timeDisplay.textContent = `시간: ${currentHour}:${String(currentMinute).padStart(2, '0')} (${day}일차)`;
}

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
        // isExpanded 상태를 건드리지 않고 그대로 사용
        if (character.isExpanded === undefined) {
            character.isExpanded = false;
        }
        grid.appendChild(createCharacterCard(character));
    });
}

function createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = `character-card ${character.isExpanded ? 'expanded' : ''}`;
    card.dataset.charId = character.id; // 캐릭터 ID를 데이터 속성으로 저장

     const actionType = character.actionType || 'script';
    let actionTypeText = actionType === 'script' ? '스크립트' : 'AI';

    // 관계 정보 표시
    let relationshipSummary = '';
    if (character.relationships && Object.keys(character.relationships).length > 0) {
        const relationshipCount = Object.keys(character.relationships).length;
        const avgAffection = Object.values(character.relationships).reduce((sum, rel) => sum + rel.affection, 0) / relationshipCount;
        relationshipSummary = `<div class="relationship-summary">관계: ${relationshipCount}명 </div>`;
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

function toggleCharacter(characterId) {
    console.log('toggleCharacter 호출됨:', characterId); // 디버깅용
    
    if (gameState.characters[characterId]) {
        const currentState = gameState.characters[characterId].isExpanded;
        gameState.characters[characterId].isExpanded = !currentState;
        
        console.log(`상태 변경: ${currentState} → ${!currentState}`); // 디버깅용
        
        updateCharacterCards();
        
        console.log('updateCharacterCards 호출 완료'); // 디버깅용
    } else {
        console.error('캐릭터를 찾을 수 없음:', characterId);
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

function addMainEvent(message, type) {
    const currentTime = gameState.currentTime || 0;
    const currentMinute = gameState.currentMinute || 0;
    const timeStr = `${currentTime.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    // const timeStr = `${gameState.currentTime.toString().padStart(2, '0')}:${gameState.currentMinute.toString().padStart(2, '0')}`;
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