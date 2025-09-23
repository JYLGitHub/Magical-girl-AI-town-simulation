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
                name: '조루디',
                gender: '여성',
                age: '24세',
                role: '대학원생 겸 프리랜서 리서처',
                avatar: '🔍',
                archetype: 'academic',
                // archetype: 'postgraduate',
                location: '대학 도서관',
                homeLocation: '조루디의 반지하 원룸',
                concept: '야망과 안락함 사이에서 영원히 갈등하는 현실주의자',
                
                appearance: '키 168cm, 마른 체형. 평소에는 깔끔한 블라우스에 슬랙스나 롱스커트를 입고 다니며 항상 노트북 가방을 메고 있음. 얇은 테 안경을 쓰고 있으며 생각할 때 안경테를 만지는 버릇이 있음. 웃을 때는 정말 밝고 따뜻하지만, 집중할 때는 눈빛이 매섭게 변함. 손가락이 길고 섬세해서 타이핑할 때 특히 눈에 띔.',
                
                personality: '표면적으로는 겸손하고 신중한 학자 타입이지만, 한번 흥미를 느끼면 그 어떤 진실이라도 파헤치고야 마는 집착적인 면이 있음. 사람들과 이야기할 때는 따뜻하고 격려적이지만, 혼자 있을 때는 세상의 어두운 면을 탐구하는 것을 즐김. 성공하고 싶은 야망이 강하지만 동시에 집에서 편안히 쉬고 싶어하는 모순된 욕구로 늘 갈등함.',
                
                values: '진실은 반드시 밝혀져야 한다, 아무리 불편하고 복잡해도. 다만 그 진실로 누군가가 다치면 신중하게 공개 여부를 결정함. 가족과 친한 사람들의 감정적 안정은 자신의 성공보다 중요하다고 생각함.',
                
                goals: '단기: 대학원 과정을 무사히 마치면서도 재미있게 보내기. 장기: 자신의 유머 감각과 소통 능력을 살릴 수 있는 일 찾기 (교육, 방송, 컨설팅 등). 하지만 성공보다는 주변 사람들과 즐겁게 지내는 것이 더 중요하다고 생각함. 언젠가는 자신만의 독특한 콘텐츠를 만들어보고 싶어함.',
                
                fears: '성공을 위해 달려가다가 정작 소중한 것들을 놓칠까봐 불안해함.',
                
                secret: '공룡에 대해 비정상적으로 해박한 지식을 가지고 있음. 실루엣만 봐도 공룡 종류를 맞출 수 있고, 공룡 관련 다큐멘터리나 논문까지 찾아볼 정도. 딱히 숨기려고 하지도 않지만 굳이 먼저 얘기하지도 않는 편. 가끔 대화 중에 "그건 트리케라톱스처럼..." 같은 비유를 자연스럽게 섞어 넣기도 함.',
                
                habits: '밤 11시부터 새벽 2시까지가 가장 집중력이 좋아서 이 시간에 중요한 작업을 함. 하지만 낮에는 카페에서 여유롭게 책을 읽으며 시간을 보내고 싶어함. 생각할 때 펜을 돌리거나 안경을 만지작거림. 스트레스받으면 무의식적으로 집 정리를 시작함.',
                
                speech: '평상시에는 "음...", "그러게요", "아하" 같은 조용하고 간결한 말투. 하지만 편한 사람들과는 "ㅋㅋㅋ 이거 개웃기네", "진짜 이건 좀...", "야야야 이거 봐봐" 같은 활발하고 드립 넘치는 말투로 급변함.',
                
                hobbies: '스팀 게임 (특히 스타듀밸리), 롤 게임, 유머짤 수집 및 공유, 실용적인 생활정보 찾기 (세금 환급 팁 등), 온라인 커뮤니티 활동, 드립 개발, 심층 리서치 (혼자 할 때), 철학책 읽기 (비밀스럽게)',
                
                likes: '드립 치기, 사람들 웃게 만들기, 재미있는 밈이나 짤 찾기, 게임 (특히 친구들과 함께), 즉흥적인 모임, 유머 있는 사람들, 분위기 좋은 카페, 새로운 농담 소재 발견, 의외의 반전이 있는 이야기',
                
                dislikes: '너무 진지하고 딱딱한 분위기, 유머를 못 알아듣는 사람들, 자신의 농담에 과도하게 화내는 사람, 일방적이고 재미없는 강의, 분위기 깨는 사람 (정작 본인도 가끔 그럼), 뻔하고 재미없는 농담, 농담으로 한 말을 진지하게 받아들이는 상황',
                
                innerConflict: '유머로 사람들과 친해지고 싶지만 때로는 농담이 과해서 상처를 줄까봐 걱정됨. 진지한 학문적 관심사가 있지만 사람들이 재미없어할까봐 드러내지 못함. 분위기 메이커 역할에 대한 부담감 vs 진짜 자신을 보여주고 싶은 욕구. 모든 걸 농담으로 넘기다 보니 정작 진지하게 말할 때 사람들이 안 믿어주는 딜레마.',
                
                worldview: '세상은 복잡하고 모순적이지만, 그 안에서도 진실과 의미를 찾을 수 있다고 믿음. 개인의 성공도 중요하지만 그것이 타인의 행복을 해치면 안 된다고 생각. 모든 문제에는 반드시 해결책이 있으며, 충분히 파고들면 본질을 발견할 수 있다는 신념. 하지만 때로는 완벽한 답보다 따뜻한 관계가 더 중요할 수도 있다는 유연성도 가지고 있음.',
                
                trauma: '고등학교 때 친한 친구의 부정행위를 발견했지만 신고하지 않았는데, 나중에 다른 학생이 그 때문에 피해를 본 것을 알게 된 경험. 그 이후로 진실을 알았을 때 어떻게 행동해야 하는지에 대해 늘 고민하게 됨. 진실 추구와 인간관계 사이에서 균형을 찾는 것이 평생 과제가 됨.',

                relationships: {
                    "민도저": {
                        affection: 0,
                        trust: 0,
                        respect: 0,
                        familiarity: 0,
                        dependency: 0,
                        rivalry: 0,
                        relationshipType: "같은 학교 후배",
                        relationshipSummary: "아직 서로에 대해 잘 모르는 상태",
                        energyModifier: 0,
                        stressModifier: 0,
                        moodInfluence: "중립",
                        interactionCount: 0,
                        lastInteraction: null,
                        conversationCount: 0,
                        sharedExperiences: [],
                        firstMet: new Date().toISOString(),
                        relationshipDuration: 0,
                        significantEvents: [],
                        conflicts: [],
                        positiveMemories: [],
                    },
                    "구선달": {
                        affection: 0,
                        trust: 0,
                        respect: 0,
                        familiarity: 0,
                        dependency: 0,
                        rivalry: 0,
                        relationshipType: "같은 학교 후배",
                        relationshipSummary: "아직 서로에 대해 잘 모르는 상태",
                        energyModifier: 0,
                        stressModifier: 0,
                        moodInfluence: "중립",
                        interactionCount: 0,
                        lastInteraction: null,
                        conversationCount: 0,
                        sharedExperiences: [],
                        firstMet: new Date().toISOString(),
                        relationshipDuration: 0,
                        significantEvents: [],
                        conflicts: [],
                        positiveMemories: [],
                    },
                }
            }),

            'char2': createCharacter({ 
                id: 'char2',
                name: '민도저',
                gender: '여성',
                age: '22세',
                role: '대학생 겸 학생회 부회장',
                avatar: '⚔️',
                archetype: 'academic',
                // archetype: 'academic',
                location: '카페',
                homeLocation: '민도저의 투룸 오피스텔',
                concept: '독립과 의존 사이에서 영원히 줄다리기하는 열정적 리더',
                
                appearance: '키 165cm, 건강한 체형. 평소 스타일은 깔끔하고 단정하지만 어딘가 강인한 느낌 - 블레이저에 스니커즈를 매치하거나 원피스에 가죽자켓을 걸치는 식. 말할 때 손짓이 크고 표정이 풍부함. 걸을 때 어깨를 쫙 펴고 빠른 걸음으로 다니지만, 사람들과 이야기할 때는 자세를 낮춰 상대방 눈높이에 맞춤.',
                
                personality: '따뜻하고 다정다감한 긍정 에너지의 화신. 리액션이 매우 풍부해서 텍스트로도 감정이 과도하게 전달되며, 물결표(~)와 느낌표(!)를 남발함. 모든 것을 의인법으로 표현하는 특이한 습관이 있음 ("이 커피가 저를 부르고 있어요~!"). 감정이 격해지면 무의식적으로 손짓이 커지고 온몸으로 표현하게 됨. 다른 사람의 이야기에 깊이 공감하고 호응해주는 프로 리액션러.',
                
                values: '모든 관계는 공평해야 한다 - 한쪽이 일방적으로 희생하거나 이득을 보는 건 절대 용납 안 함. 하지만 자신은 기꺼이 남들보다 더 많이 하려고 함. 정의롭지 못한 상황을 보면 참지 못하고 나선다.',
                
                goals: '단기: 학생회에서 실질적인 변화를 만들어내기. 장기: 사회정의를 실현할 수 있는 분야에서 리더가 되기. 하지만 이 모든 걸 혼자가 아닌 믿을 수 있는 파트너와 함께 이루고 싶어함. 목표 달성보다도 "함께 싸워줄 사람"을 찾는 게 더 절실함.',
                
                fears: '자신의 강한 성격 때문에 사람들이 부담스러워하거나 떠날까봐 두려워함. 특히 연인 관계에서 "너무 센 여자"라는 소리를 들을까봐 불안해하면서도, 자신을 약하게 포장하는 것도 거부하는 딜레마에 빠져 있음.',
                
                secret: '사실 혼자 있는 시간을 견디지 못함. 집에 혼자 있으면 불안해서 친구들에게 계속 연락하거나 카페로 나가버림. 하지만 이런 모습을 보이면 독립적이지 못한 사람으로 보일까봐 숨기고 있음.',
                
                habits: '스트레스 받으면 방 정리를 하거나 운동을 함. 특히 복싱이나 킥복싱 같은 격투기를 좋아함. 중요한 결정을 내리기 전에는 반드시 신뢰하는 사람들과 상의함. 화가 나면 일단 혼자만의 시간을 가진 뒤, 나중에 차근차근 대화로 풀려고 노력함.',
                
                speech: '"와~ 정말요~?!", "너무 좋네요!!!", "오오오 이거 완전 대박~!", "아 진짜 귀여워!!!" 같은 과도한 리액션과 물결표, 느낌표 남발. 모든 것을 의인법으로 표현함 ("이 커피가 저를 부르고 있어요~!", "저 꽃이 웃고 있는 것 같아요!", "제 핸드폰이 삐져서 울고 있어요ㅠㅠ"). 흥미진진한 이야기를 할 때는 손짓 발짓이 커지고 온몸으로 표현함.',
                
                hobbies: '클라이밍, 자전거 타기 (출퇴근용), 스토리 있는 게임 (몬스터 헌터, 발더스 게이트), 문화 행사 참여 (불교 박람회 등), 고양이 및 동물 관련 컨텐츠 소비, 온라인 커뮤니티 관리, 따뜻한 분위기 만들기',
                
                likes: '정의로운 싸움, 팀워크가 좋은 그룹, 솔직한 피드백, 공정한 경쟁, 함께 목표를 달성하는 순간, 서로를 응원해주는 관계, 균형 잡힌 공간, 명확한 역할 분담',
                
                dislikes: '불공정한 대우, 뒤에서 험담하는 사람들, 일방적인 관계, 애매한 상황, 갈등을 피하려고만 하는 태도, 혼자 모든 책임을 떠안게 되는 상황, 자신의 노력을 당연하게 여기는 사람들',
                
                innerConflict: '모든 걸 스스로 해결하고 싶은 독립 욕구 vs 파트너와 함께하고 싶은 관계 욕구. 리더로서 앞장서야 한다는 책임감 vs 누군가가 자신을 돌봐주기를 바라는 마음. 강한 모습을 보여야 한다는 부담감 vs 솔직한 감정을 표현하고 싶은 욕구.',
                
                worldview: '세상은 불공정하지만 노력하면 바꿀 수 있다고 믿음. 모든 문제는 소통과 협력으로 해결 가능하다고 생각하지만, 때로는 혼자서 밀어붙여야 할 때도 있다는 것을 알고 있음. 진정한 강함은 혼자서 모든 걸 감당하는 게 아니라, 서로 의지할 수 있는 관계를 만드는 것이라고 믿지만 실천은 어려워함.',
                
                trauma: '고등학교 때 학급 임원으로서 부정행위를 고발했는데, 결과적으로 반 전체가 자신을 따돌린 경험. 옳은 일을 했지만 결국 혼자가 된 상황에서 "정의로운 일을 하면서도 사람들과 좋은 관계를 유지할 수 있는 방법이 정말 있을까?"라는 근본적 의문을 갖게 됨. 이후 강한 신념과 관계 유지 사이에서 늘 갈등하게 됨.', 

                relationships: {
                    "조루디": {
                        affection: 0,
                        trust: 0,
                        respect: 0,
                        familiarity: 0,
                        dependency: 0,
                        rivalry: 0,
                        relationshipType: "같은 학교 선배",
                        relationshipSummary: "아직 서로에 대해 잘 모르는 상태",
                        energyModifier: 0,
                        stressModifier: 0,
                        moodInfluence: "중립",
                        interactionCount: 0,
                        lastInteraction: null,
                        conversationCount: 0,
                        sharedExperiences: [],
                        firstMet: new Date().toISOString(),
                        relationshipDuration: 0,
                        significantEvents: [],
                        conflicts: [],
                        positiveMemories: [],
                    },
                    "구선달": {
                        affection: 0,
                        trust: 0,
                        respect: 0,
                        familiarity: 0,
                        dependency: 0,
                        rivalry: 0,
                        relationshipType: "같은 학교 선배",
                        relationshipSummary: "아직 서로에 대해 잘 모르는 상태",
                        energyModifier: 0,
                        stressModifier: 0,
                        moodInfluence: "중립",
                        interactionCount: 0,
                        lastInteraction: null,
                        conversationCount: 0,
                        sharedExperiences: [],
                        firstMet: new Date().toISOString(),
                        relationshipDuration: 0,
                        significantEvents: [],
                        conflicts: [],
                        positiveMemories: [],
                    },
                }
            }),

            'char3': createCharacter({ 
                id: 'char3',
                name: '구선달',
                gender: '여성',
                age: '23세',
                role: '미술대학 4학년 겸 온라인 콘텐츠 크리에이터',
                avatar: '🎭',
                archetype: 'academic',
                // archetype: 'academic',
                location: '대학교 미술관',
                homeLocation: '구선달의 원룸',
                concept: '친밀함과 자유 사이에서 영원히 방황하는 예술가',
                
                appearance: '키 167cm, 우아한 체형. 평소에는 빈티지와 모던을 절묘하게 섞은 개성 있는 패션을 선호 - 클래식한 블라우스에 독특한 액세서리를 매치하는 식. 긴 웨이브 머리에 표정이 매우 풍부함. 웃을 때는 정말 따뜻하고 매력적이지만, 혼자 있을 때는 묘하게 차가운 분위기가 남. 손동작이 우아하고 말할 때 자연스럽게 상대방을 매료시키는 아우라가 있음.',
                
                personality: '사람들 앞에서는 카리스마 넘치고 따뜻한 리더이지만, 정작 혼자만의 시간에서 진정한 자신을 찾는 타입. 상대방의 감정을 기가 막히게 읽어내지만, 자신의 깊은 감정은 쉽게 드러내지 않음. 친해지고 싶으면서도 너무 가까워지면 불편해하는 모순적인 성격. 창의적이고 열정적이지만 동시에 매우 신중하고 계획적임.',
                
                values: '진정성 있는 관계를 가장 중요하게 생각하지만, 그와 동시에 개인의 자유와 독립성도 절대 포기할 수 없다고 믿음. 예술과 창작에서는 타협하지 않으며, 자신만의 독특한 색깔을 유지하는 것을 최우선으로 여김.',
                
                goals: '단기: 졸업 작품전 성공적으로 마치고 대학원 진학 또는 갤러리 취업. 장기: 사람들에게 진정한 감동을 주는 작품을 남기기. 하지만 성공보다도 "내가 정말 원하는 삶이 무엇인지"를 계속 탐구하는 것이 더 중요함.',
                
                fears: '누군가에게 완전히 의존하게 되거나, 반대로 완전히 혼자가 될까봐 두려워함.',
                
                secret: '실제로는 사람들과 함께 있을 때조차 종종 외로움을 느끼며, 진정한 소울메이트를 찾고 있지만 동시에 그런 관계가 자신의 자유를 제한할까봐 두려워하는 모순된 마음을 가지고 있음.',
                
                habits: '창작할 때는 반드시 혼자 있어야 하며, 작업 전에 명상이나 산책으로 마음을 정리함. 사람들과 만날 때는 항상 약간의 "무대 의상"을 입는다고 생각하며 차려입음. 스트레스받으면 갑자기 모든 약속을 취소하고 며칠간 혼자만의 시간을 가짐.',
                
                speech: '평상시에는 "어머, 정말?", "그거 재미있겠네!", "우리 이거 해볼까?" 같은 따뜻하고 사교적인 말투. 하지만 진지한 대화에서는 "사실 나는...", "정말 솔직히 말하면...", "너도 그런 적 있어?" 같은 깊이 있는 표현을 씀. 가끔 혼자 중얼거리는 습관이 있음.',
                
                hobbies: '미술 (특히 혼합매체 작업), 사진 촬영, 빈티지 소품 수집, 심리학 관련 책 읽기, 독립영화 감상, 작은 카페나 갤러리 탐방, 타로카드 (자신과 가까운 사람들을 위해서만), 일기 쓰기 (감정 정리용)',
                
                likes: '예술적 영감을 주는 공간, 깊이 있는 대화, 혼자만의 시간, 독특하고 개성 있는 사람들, 감성적인 음악, 따뜻한 조명, 의미 있는 선물 주고받기, 자유로운 분위기',
                
                dislikes: '피상적인 사교 모임, 지나친 간섭이나 통제, 예측 가능한 일상의 반복, 감정을 숨기라는 압박, 창의성을 제한하는 규칙들, 진부한 로맨스나 클리셰, 자신의 시간을 강제로 빼앗는 상황',
                
                innerConflict: '완전한 소속감과 깊은 유대를 원하면서도 완전한 자유와 독립을 갈망하는 모순. 사람들에게 사랑받고 싶지만 동시에 아무도 자신을 완전히 이해할 수 없을 거라는 두려움. 예술가로서의 성공 욕구 vs 순수한 창작 욕구 사이의 갈등.',
                
                worldview: '모든 사람은 복잡하고 다층적인 존재이며, 진정한 이해는 시간과 노력이 필요하다고 믿음. 사랑과 자유는 대립하는 것이 아니라 조화를 이룰 수 있다고 생각하지만, 그 균형점을 찾는 것이 평생의 과제라고 여김. 예술을 통해 사람들의 마음을 치유하고 연결할 수 있다는 신념을 가지고 있음.',
                
                trauma: '고등학교 때 첫사랑과의 관계에서 상대방이 자신을 너무 독점하려 해서 숨이 막혔던 경험. 결국 관계를 끝냈지만 그 후로도 오랫동안 "내가 사랑을 제대로 할 수 있는 사람인가?"라는 의문에 시달림. 그 이후로 깊은 관계에 대한 갈망과 두려움을 동시에 갖게 됨. 대학에서는 선후배 관계나 동기들과의 관계에서도 이런 패턴이 반복되어 고민이 깊어짐.',
                relationships: {
                    "조루디": {
                        affection: 0,
                        trust: 0,
                        respect: 0,
                        familiarity: 0,
                        dependency: 0,
                        rivalry: 0,
                        relationshipType: "같은 학교 선배",
                        relationshipSummary: "아직 서로에 대해 잘 모르는 상태",
                        energyModifier: 0,
                        stressModifier: 0,
                        moodInfluence: "중립",
                        interactionCount: 0,
                        lastInteraction: null,
                        conversationCount: 0,
                        sharedExperiences: [],
                        firstMet: new Date().toISOString(),
                        relationshipDuration: 0,
                        significantEvents: [],
                        conflicts: [],
                        positiveMemories: [],
                    },
                    "민도저": {
                        affection: 0,
                        trust: 0,
                        respect: 0,
                        familiarity: 0,
                        dependency: 0,
                        rivalry: 0,
                        relationshipType: "같은 학교 후배",
                        relationshipSummary: "아직 서로에 대해 잘 모르는 상태",
                        energyModifier: 0,
                        stressModifier: 0,
                        moodInfluence: "중립",
                        interactionCount: 0,
                        lastInteraction: null,
                        conversationCount: 0,
                        sharedExperiences: [],
                        firstMet: new Date().toISOString(),
                        relationshipDuration: 0,
                        significantEvents: [],
                        conflicts: [],
                        positiveMemories: [],
                    },
                }
            }),
            

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