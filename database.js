// 📍 database.js (AI Town 스타일 최종본)  '월드' 객체 전체를 저장하고 불러오는 진정한 '월드 저장소'

const fs = require('fs');
const path = require('path');
const { createCharacter } = require('./schema.js');

const DB_FILE_PATH = path.join(__dirname, 'simulation_database.json');

/**
 * 저장된 월드(world)를 파일에서 불러옵니다.
 * @returns {object | null} 월드 객체 또는 파일이 없으면 null
 */
function loadWorld() {
    try {
        if (fs.existsSync(DB_FILE_PATH)) {
            const data = fs.readFileSync(DB_FILE_PATH, 'utf8');
            return JSON.parse(data);
        }
        return null; // 파일이 없으면 명확하게 null을 반환합니다.
    } catch (error) {
        console.error('Error loading world:', error);
        return null;
    }
}

/**
 * 현재 월드를 파일에 저장합니다.
 * @param {object} world - 저장할 월드 객체
 */
function saveWorld(world) {
    try {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(world, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving world:', error);
    }
}

/**
 * 시뮬레이션의 가장 초기 상태인 월드를 생성합니다.
 * @returns {object} 초기 월드 객체
 */
function initializeWorld() {
    const initialWorld = {
        characterDatabase: {
            'char1': createCharacter({ id: 'char1', name: '이민지', age: '21', role: '대학생', avatar: '👩‍🎓', archetype: 'student', personality: `[성격: 내향적이고 창의적임], [가치관: 안정과 성실함], [관심사: 그림 그리기, 미스터리 소설 읽기], [현재 목표: 다가오는 프로젝트 공모전에서 좋은 성과 내기], [특징: 가끔 엉뚱한 상상을 즐김], [좋아하는 것: 단 디저트, 책 읽기]` }),
            'char2': createCharacter({ id: 'char2', name: '강준호', age: '32', role: '직장인', avatar: '👨‍💼', archetype: 'officeWorker', personality: `[성격: 무뚝뚝하고 논리적임], [가치관: 효율성과 성취], [관심사: 최신 IT 기기, 전략 게임], [현재 목표: 회사에서 진행하는 프로젝트 성공적으로 이끌기], [특징: 무뚝뚝하지만 속은 따뜻함], [좋아하는 것: 커피, 컴퓨터 게임]` }),
            'char3': createCharacter({ id: 'char3', name: '이수영', age: '34', role: '카페 사장', avatar: '👩‍💼', archetype: 'storeOwner', personality: `[성격: 사교적이고 공감 능력이 뛰어남], [가치관: 관계와 즐거움], [관심사: 새로운 디저트 만들기, 동네 사람들과 수다 떨기], [현재 목표: 가게의 단골 손님 늘리기], [특징: 다른 사람의 고민을 잘 들어줌], [좋아하는 것: 원두 냄새, 디저트 장식하기], [행동 방식: 나는 사람들과의 관계를 가장 중요하게 생각해. 갈등이 생기는 걸 싫어해서 어떻게든 좋게 해결하려고 노력하는 편이야. 가끔은 너무 남을 신경 쓰다가 내 에너지가 방전될 때도 있지만, 그래도 다른 사람이 행복해하는 모습을 보면 나도 행복해져. 만약 내가 약속에 늦거나 실수를 했다면, 상대방의 기분이 상했을까 봐 몇 번이고 미안하다고 표현하며 관계를 회복하려고 애쓸 거야.]` })
        },
        situation: {
            day: 1,
            currentHour: 8,
            currentMinute: 0,
        },
        activeConversations: [], // 에러 해결의 핵심
        messageQueue: [],
    };
    saveWorld(initialWorld);
    console.log('Initial world created and saved.');
    return initialWorld;
}

module.exports = {
    loadWorld,
    saveWorld,
    initializeWorld,
};