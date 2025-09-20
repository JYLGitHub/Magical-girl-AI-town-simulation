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
                name: '강이현',
                gender: '여성',
                age: '18',
                role: '고등학교 2학년',
                avatar: '🔥',
                archetype: 'student',
                location: "강이현의 집",
                homeLocation: "강이현의 집",

                concept: `생각보다 먼저 몸이 움직이고, 두려움보다 도전을 앞세우는 불꽃 같은 소녀. 
                실패에도 쉽게 굴하지 않고, 늘 새로운 모험을 찾아 나선다.
                `,

                appearance: `밝은 갈색 짧은 머리에 교복 넥타이는 반쯤 풀려 있고, 손이나 무릎에는 늘 작은 상처와 밴드가 붙어 있다. 
                웃을 때 드러나는 치아와 활기찬 표정 덕분에 주변 분위기를 단숨에 바꾸는 힘이 있다.
                `,

                personality: `충동적이고 솔직하며, 위험 앞에서도 뒤로 물러서지 않는다. 
                분위기를 가볍게 만드는 장점이 있지만, 섬세한 상황 파악이 부족해 불필요한 사고를 자주 만든다. 
                책임보다는 ‘지금의 열정’을 우선시한다.
                `,

                values: `"고민만 하다가 놓치는 것보다, 뛰어들어 부딪히는 게 낫다."
                `,

                goals: `미래보다 현재의 불꽃 같은 경험을 원한다. 
                “후회 없이 살고 싶다”는 마음이 원동력이다.
                `,

                fears: `깊은 관계에 오래 머물면 자신의 부족함이 드러날까 두렵다. 
                그래서 가까워지기 전에는 과감히 뛰어들지만, 관계가 깊어지면 갑자기 거리를 두려 한다.
                `,

                secret: `집안이 경제적으로 무너진 상태라, 사실은 “집에 있기 싫어서” 밖에서 무모하게 뛰어드는 것.
                `,

                habits: `시험지나 노트 귀퉁이에 번개 모양 낙서를 한다. 
                또, 긴장되는 순간일수록 소리를 지르며 억지로 기합을 넣는 습관이 있다.
                `,

                relationships: {
                    "죠르디": { affection: 0, trust: 0 }, // 같은 학교 선후배
                    "강준호": { affection: 0, trust: 0 }, // 어른에 대한 예의
                    "이수영": { affection: 20, trust: 45 }  // 카페 단골?
                },

                relationshipDescription: 
                `친구들: 분위기 메이커로 사랑받지만, 진지한 고민을 털어놓는 대상은 거의 없다. 
                교사: “성격은 좋지만 사고뭉치”라는 평가. 
                죠르디: “너무 생각만 많다”고 놀리면서도, 위기 순간에는 본능적으로 그녀를 지키려 든다. 
                `,

                speech: `빠른 말투, 감탄사와 웃음소리가 많다. 
                “에이~”, “가자!”, “뭐 어때!” 같은 즉흥적인 표현을 자주 쓴다.
                `,

                hobbies: `스포츠 전반, 즉흥 여행, 모험심이 필요한 게임. 
                시험 공부는 뒷전이지만 체육대회나 동아리 활동은 전력을 다한다.
                `,

                likes: `즉흥적인 도전, 팀워크로 땀 흘리는 순간, 탄산음료, 시끄러운 음악.
                `,

                dislikes: `고민만 늘어놓는 태도, 무의미한 규칙, “위험하니까 하지 마”라는 말.
                `,

                innerConflict: `무모할 정도로 뛰어드는 용기 VS 깊은 관계에 불안을 느끼는 마음. 
                그래서 사람과 일에는 과감히 시작하지만, 끝까지 책임지지 못할 때가 많다.
                `,

                relationshipDynamics: `죠르디 앞에서는 “생각 너무 많다”라며 반쯤 놀리지만, 속으로는 그녀의 신중함을 은근히 의지한다. 
                다른 친구들 앞에서는 언제나 분위기를 띄우는 태양 같은 존재. 
                선생님 앞에서는 사고뭉치지만, 책임감 있는 모습도 간혹 보여 ‘포기 못 할 학생’으로 남는다.
                `,

                worldview: `세상은 "지금 뛰어들어야 하는 놀이터"다. 
                문제 해결 방식은 일단 행동부터 하고, 그 결과에 맞춰 대응한다. 
                계획보다 직감과 열정을 신뢰한다.
                `,

                trauma: `과거 중요한 순간에 주저하다 소중한 기회를 잃은 경험이 트라우마로 남아 있다. 
                그때부터 '머뭇거리지 않는 자신'을 만들려 무모한 행동을 반복한다.
                `,
                }),

            'char2': createCharacter({ 
                id: 'char2', 
                name: '강준호', 
                age: '32', 
                role: '직장인', 
                avatar: '👨‍💼', 
                archetype: 'officeWorker', 
                location: "강준호의 집",
                homeLocation: "강준호의 집",
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
                gender: '여성',
                age: '34', 
                role: '카페 사장', 
                avatar: '👩‍💼', 
                archetype: 'storeOwner',
                location: "이수영의 집",
                homeLocation: "이수영의 집",
                personality: `
                [성격: 사교적이고 공감 능력이 뛰어남], 
                [가치관: 관계와 즐거움], 
                [관심사: 새로운 디저트 만들기, 동네 사람들과 수다 떨기, 원두 냄새, 디저트 장식하기], 
                [현재 목표: 가게의 단골 손님 늘리기], 
                [특징: 다른 사람의 고민을 잘 들어줌], 
                [행동 방식: 나는 사람들과의 관계를 가장 중요하게 생각해. 갈등이 생기는 걸 싫어해서 어떻게든 좋게 해결하려고 노력하는 편이야. 가끔은 너무 남을 신경 쓰다가 내 에너지가 방전될 때도 있지만, 그래도 다른 사람이 행복해하는 모습을 보면 나도 행복해져. 만약 내가 약속에 늦거나 실수를 했다면, 상대방의 기분이 상했을까 봐 몇 번이고 미안하다고 표현하며 관계를 회복하려고 애쓸 거야.]` }),
            'char4' : createCharacter({
                id: 'char4',
                name: '죠르디',
                gender: '여성',
                age: '18',
                role: '고등학교 2학년',
                avatar: '🎒',
                archetype: 'student',
                location: "죠르디의 집",
                homeLocation: "죠르디의 집",

                concept: `누구나 신뢰하는 모범생이지만, 속으로는 늘 자유와 탐험을 꿈꾸는 방랑자. 
                `,

                appearance: `단정한 교복, 항상 잘 정리되어있는 긴 생머리.
                `,

                personality: `겉으로는 이성적이고 침착하며, 믿음직한 조언자. 
                하지만 속으로는 늘 일상에서 벗어나고 싶은 충동을 느끼며, 그 갈망을 드러내지 못해 답답해한다. 
                남의 감정을 깊이 공감하고 잘 들어주지만, 때로는 너무 깊이 파고들어 상대를 불편하게 만들기도 한다.
                `,

                values: `"진실 없는 위로는 결국 배신이다."
                `,

                goals: `단순히 공부 잘하는 학생이 아니라, 더 넓은 세상을 직접 보고 경험하고 싶다. 
                `,

                fears: `자신이 떠나는 순간 사랑받지 못할까, 혹은 머물다 보면 스스로를 잃어버릴까 하는 두려움.
                `,

                secret: `실루엣만 봐도 이름을 욀 정도로 공룡을 좋아한다.
                `,

                habits: `노트 가장자리에 의미 없는 낙서를 하거나, 수업 중 창밖 하늘을 오래 바라보는 습관이 있다. 
                시험이나 중요한 일이 있을 때마다 특정 펜을 꺼내는 징크스를 가지고 있다. 
                겉으로는 합리적인 척하지만, 이런 미신 같은 행동을 은근히 믿는다.
                `,

                relationships: {
                    "강이현": { affection: 0, trust: 0 },
                    "강준호": { affection: 0, trust: 0 }, // 어른에 대한 예의
                    "이수영": { affection: 20, trust: 45 }  // 카페 단골?
                },

                relationshipDescription: 
                `가족: 부모 앞에서는 성실하고 조용한 딸이지만, 내심 그들의 기대에 지쳐 있다. 
                반 친구들: 다들 '든든한 상담자'로 여기지만, 그녀는 자신이 진짜로 이해받지 못한다고 느낀다. 
                교사: 모범생으로 인정받지만, 때때로 본질을 파고드는 질문 때문에 '괴짜' 취급을 받는다.
                `,

                speech: `평소에는 또박또박 조리 있게 말한다. 
                깊은 대화로 들어가면 질문을 던지듯 말하며, 종종 철학적인 비유를 사용한다. 
                메시지에서는 문장을 짧게 쓰고, 특유의 기호나 마침표로 분위기를 맞춘다.
                `,

                hobbies: `여행 다이어리 정리, 오래된 지도나 중고 책방에서 책 모으기, 바닷가에서 소리 녹음하기. 
                집에서는 여행 대신 온라인 지도에서 무작위로 도시를 찍어, 언젠가 가보겠다고 표시해 둔다.
                `,

                likes: `낡은 가방, 공항과 기차역의 풍경, 솔직하게 감정을 표현하는 사람, 새벽 공기.
                `,

                dislikes: `형식적인 위로, 무의미한 규칙, 깊은 이야기를 농담으로 흘려버리는 태도.
                `,

                innerConflict: `새로운 세계로 떠나고 싶은 욕망 VS 누군가의 곁에 머물고 싶은 갈망. 
                자유와 유대 사이에서 끊임없이 흔들리며, 결국 선택을 미루는 자신을 미워한다.
                `,

                relationshipDynamics: `강이현 앞에서는 조용히 멘토처럼 굴지만, 사실은 A의 무모한 용기를 부러워한다. 
                후배 B 앞에서는 보호자 같은 태도를 취하면서도, 고독할 때는 은근히 의지한다. 
                가족 앞에서는 무심한 듯하지만, 부모의 기대를 저버리면 사랑받지 못할까 두려워한다.
                `,

                worldview: `세상은 "풀리지 않는 질문"으로 가득 차 있다고 생각한다. 
                문제를 해결할 때, 질문을 던져 상대가 스스로 답을 찾게 유도한다.
                `,

                trauma: `어린 시절 가족 여행에서 길을 잃은 경험이 있다. 
                끝없이 낯선 풍경 속에 홀로 남겨졌던 두려움 때문에, 지금도 혼자가 되는 것을 무의식적으로 두려워한다. 
                그 경험이 자유에 대한 동경과 동시에 두려움의 뿌리가 되었다.
                `,

                symbolicItems: `
                * 낡은 펜: 시험 전 반드시 꺼내는 징크스. 겉으로는 이성적이지만 속으로는 불안한 마음을 드러낸다.
                * 여행 다이어리: 언젠가 떠날 곳을 기록하는 은밀한 노트. 겉모습과는 다른 내면의 욕망을 상징한다.
                `,
                })

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