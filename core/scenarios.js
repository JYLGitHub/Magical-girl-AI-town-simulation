const locations = {
    // 개인 주거지
    "강이현의 집": {
        description: "고급 주택가에 있지만 집안 곳곳에 딱지가 붙어있다. 이현의 방은 기본적인 가구들 뿐이며 정리할 자리가 없어 옷이나 물건들이 곳곳에 널려있다.",
        capacity: 3,
        type: "residential"
    },
    "죠르디의 집": {
        description: "밝고 깔끔한 고등학생의 방. 책상 위에 교재들과 귀여운 소품들이 정리되어 있다. 엄마, 여동생과 함께 산다.",
        capacity: 3,
        type: "residential"
    },
    "home": {
        description: "깔끔하고 효율적으로 정리된 성인 남성의 집. 최소한의 가구로 실용성을 추구한다. 혼자 산다.",
        capacity: 3, 
        type: "residential"
    },
    "home": {
        description: "카페 위층에 위치한 아늑한 원룸. 커피 향이 은은하게 퍼진다.",
        capacity: 3,
        type: "residential" 
    },
    
    // 공용 장소
    "카페": {
        description: "이수영이 운영하는 따뜻한 분위기의 카페",
        capacity: 6,
        type: "commercial"
    },
    "식당": {
        description: "동네 맛집으로 유명한 가족 식당",
        capacity: 8,
        type: "commercial"
    },
    "회사": {
        description: "현대적인 오피스 빌딩",
        capacity: 10,
        type: "workplace"
    },
    "학교": {
        description: "강이현과 죠르디가 다니는 고등학교",
        capacity: 15,
        type: "educational"
    }
};
const scenarios = {
    modern: {
        worldName: "현대 도시",
        locations: ["집", "학교", "회사", "카페", "도서관", "식당", "공원", "작업실", "상점"],
        archetypes: {
            student: {
                schedule: {
                    weekday: {
                        6: { location: 'home', status: '기상 및 아침 준비' },
                        9: { location: '학교', status: '오전 수업' },
                        12: { location: '식당', status: '점심 식사' },
                        14: { location: '학교', status: '오후 수업' },
                        18: { location: 'home', status: '저녁 식사' },
                        19: { location: 'home', status: '자유 시간' },
                        23: { location: 'home', status: '취침' }
                    },
                    weekend: {
                        9: { location: 'home', status: '늦잠' },
                        11: { location: 'home', status: '자유 시간' },
                        13: { location: 'home', status: '자유 시간' },
                        18: { location: 'home', status: '저녁 식사' },
                        20: { location: 'home', status: '자유 시간' },
                        23: { location: 'home', status: '취침' }
                    }
                }
            },
            officeWorker: {
                schedule: {
                    weekday: {
                        7: { location: 'home', status: '기상 및 출근 준비' },
                        9: { location: '회사', status: '오전 근무' },
                        12: { location: '식당', status: '점심 식사' },
                        13: { location: '회사', status: '오후 근무' },
                        19: { location: 'home', status: '저녁 식사' },
                        20: { location: 'home', status: '자유 시간' },
                        23: { location: 'home', status: '취침' }
                    },
                    weekend: {
                        10: { location: 'home', status: '기상 및 휴식' },
                        12: { location: 'home', status: '자유 시간' },
                        14: { location: '공원', status: '산책 및 여가' },
                        19: { location: 'home', status: '저녁 식사' },
                        20: { location: 'home', status: '자유 시간' },
                        23: { location: 'home', status: '취침' }
                    }
                }
            },
            storeOwner: {
                schedule: {
                    weekday: {
                        8: { location: 'home', status: '기상 및 오픈 준비' },
                        10: { location: '카페', status: '오전 영업' },
                        13: { location: '카페', status: '점심 식사 및 휴식' },
                        14: { location: '카페', status: '오후 영업' },
                        // 💥 해결책: 저녁 8시에 퇴근하여 집으로 돌아오는 스케줄 추가
                        20: { location: 'home', status: '영업 종료 및 저녁 식사' },
                        21: { location: 'home', status: '자유 시간' },
                        23: { location: 'home', status: '취침' }
                    },
                    weekend: {
                        9: { location: 'home', status: '기상 및 오픈 준비' },
                        11: { location: '카페', status: '주말 영업 시작' },
                        14: { location: '카페', status: '점심 및 재고 정리' },
                        15: { location: '카페', status: '주말 오후 영업' },
                        // 💥 해결책: 주말에도 퇴근 후 휴식 시간을 보장
                        21: { location: 'home', status: '영업 종료 및 휴식' },
                        22: { location: 'home', status: '자유 시간' },
                        23: { location: 'home', status: '취침' }
               
                    }    
                }
            }
        }
    },
    fantasy: {
        worldName: "아스테리아 왕국",
        locations: ["왕궁", "마탑", "기사단 훈련소", "상점가", "주점", "숲"],
        archetypes: {
            knight: { schedule: {}, scriptedActions: {} },
            mage: { schedule: {}, scriptedActions: {} }
        }
    }
};

module.exports = { scenarios, locations };