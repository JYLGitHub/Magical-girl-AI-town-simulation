// 📍 database.js  '월드' 객체 전체를 저장하고 불러오는 진정한 '월드 저장소'

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
            'char1': createCharacter({ 
                id: 'char1', 
                name: '김인하',
                gender: '여성',
                age: '18', 
                role: '고등학교 2학년',
                avatar: '👩‍🎓', 
                archetype: 'student', 
                location: "김인하의 집",
                appearance: '긴 생머리를 항상 낮은 포니테일로 묶고 다니며, 화장은 거의 하지 않는다. 눈웃음이 매력적이라 친근한 인상을 주지만, 피곤하면 눈 밑 다크서클이 도드라져서 은근히 언밸런스한 느낌을 준다.',
                personality: `
                겉으로는 얌전하고 상냥하지만 속으로는 강박적인 책임감을 가지고 있으며, 남을 돕지만 자신은 도움을 청하지 못한다.
                `, 

                likes: `
                따뜻한 허브티, 파스텔톤 색감, 도서관 같은 조용한 공간, 성실하게 노력하는 사람.
                `,

                dislikes: `
                약속을 어기는 사람, 갑작스러운 변수나 계획 없는 행동, 시끄러운 장소, 다른 사람에게 민폐 끼치는 상황.
                `,

                values: `
                약속은 어떤 상황에서도 반드시 지켜야 한다.
                `, 

                goals: `
                평범하고 조용한 학창시절을 보내고 싶다.
                `, 

                fears: `
                자신 때문에 주변이 망가질까 두려워 과도한 짐을 떠안는다.
                `, 

                secret: `
                중학교 시절, 친구와의 약속을 지키지 못해 절교한 경험이 있으며 이를 숨기고 있다.
                `, 

                habits: `
                매일 자기 전 내일 할 일을 수첩에 기록하지 않으면 불안해서 잠들지 못한다.
                `, 

                relationships: `
                가족: 맞벌이 부모 대신 동생을 돌보며 애어른 같은 마음을 품는다.
                반 친구들: 무난한 좋은 애로 통하지만 속 깊은 이야기는 나누지 않는다.
                `, 

                speech: `
                정중하고 차분히 말하려 하지만 당황하면 말이 꼬이며, 메시지는 짧게 쓰고 이모티콘은 잘 쓰지 않는다.
                `, 

                hobbies: `
                독서와 색깔별 노트 정리에 집착하며, 혼자 있을 때는 피아노 음악을 듣는다.
                `, 

                innerConflict: `
                평범하게 살고 싶다는 바람 VS 책임감 때문에 남을 돕고 나서는 자신.
                `, 

                relationshipDynamics: `
                가장 친한 친구 앞에서는 보호자처럼 굴지만 동시에 의지하기도 한다. 
                동생 앞에서는 엄격한 언니이면서도 의존받는 것을 내심 좋아한다.
                `, 

                worldview: `
                세상을 흘러가는 강물처럼 보고 큰 파도를 만들지 않으려 한다. 
                문제는 정면 돌파보다 묵묵히 뒤에서 챙기는 방식으로 해결한다.
                `, 

                trauma: `
                중학교 시절 친구와의 약속을 지키지 못해 절교당한 기억이 남아 있어, 누군가에게 실망을 주는 일을 극도로 두려워한다.
                ` }),

            'char2': createCharacter({ 
                id: 'char2', 
                name: '강준호', 
                age: '32', 
                role: '직장인', 
                avatar: '👨‍💼', 
                archetype: 'officeWorker', 
                location: "강준호의 집",
                personality: `
                [성격: 무뚝뚝하고 논리적임], 
                [가치관: 효율성과 성취], 
                [관심사: 최신 IT 기기, 전략 게임, 커피], 
                [현재 목표: 회사에서 진행하는 프로젝트 성공적으로 이끌기], 
                [특징: 무뚝뚝하지만 속은 따뜻함], 
                ` }),
            'char3': createCharacter({ 
                id: 'char3', 
                name: '이수영', 
                age: '34', 
                role: '카페 사장', 
                avatar: '👩‍💼', 
                archetype: 'storeOwner',
                location: "이수영의 집",
                personality: `
                [성격: 사교적이고 공감 능력이 뛰어남], 
                [가치관: 관계와 즐거움], 
                [관심사: 새로운 디저트 만들기, 동네 사람들과 수다 떨기, 원두 냄새, 디저트 장식하기], 
                [현재 목표: 가게의 단골 손님 늘리기], 
                [특징: 다른 사람의 고민을 잘 들어줌], 
                [행동 방식: 나는 사람들과의 관계를 가장 중요하게 생각해. 갈등이 생기는 걸 싫어해서 어떻게든 좋게 해결하려고 노력하는 편이야. 가끔은 너무 남을 신경 쓰다가 내 에너지가 방전될 때도 있지만, 그래도 다른 사람이 행복해하는 모습을 보면 나도 행복해져. 만약 내가 약속에 늦거나 실수를 했다면, 상대방의 기분이 상했을까 봐 몇 번이고 미안하다고 표현하며 관계를 회복하려고 애쓸 거야.]` })
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