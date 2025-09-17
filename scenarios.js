const locations = {
    "집": { x: 5, y: 5, description: "편안한 휴식 공간" },
    "카페": { x: 20, y: 15, description: "따뜻한 커피와 대화가 있는 곳" },
    "회사": { x: 5, y: 25, description: "치열한 일터" },
    "도서관": { x: 20, y: 25, description: "지식이 쌓이는 조용한 공간" },
    "공원": { x: 15, y: 10, description: "마음이 편안해지는 산책로" }
};
const scenarios = {
    modern: {
        worldName: "현대 도시",
        locations: ["집", "회사", "카페", "도서관", "식당", "공원", "작업실", "상점"],
        archetypes: {
            student: {
                schedule: {
                    weekday: {
                        6: { location: '집', status: '기상 및 아침 준비' },
                        9: { location: '도서관', status: '오전 공부' },
                        12: { location: '식당', status: '점심 식사' },
                        14: { location: '도서관', status: '오후 공부' },
                        18: { location: '집', status: '저녁 식사' },
                        19: { location: '집', status: '자유 시간' },
                        23: { location: '집', status: '취침' }
                    },
                    weekend: {
                        9: { location: '집', status: '늦잠' },
                        11: { location: '집', status: '자유 시간' },
                        13: { location: '카페', status: '친구와 약속' },
                        18: { location: '집', status: '저녁 식사' },
                        20: { location: '집', status: '자유 시간' },
                        23: { location: '집', status: '취침' }
                    }
                }
            },
            officeWorker: {
                schedule: {
                    weekday: {
                        7: { location: '집', status: '기상 및 출근 준비' },
                        9: { location: '회사', status: '오전 근무' },
                        12: { location: '식당', status: '점심 식사' },
                        13: { location: '회사', status: '오후 근무' },
                        19: { location: '집', status: '저녁 식사' },
                        20: { location: '집', status: '자유 시간' },
                        23: { location: '집', status: '취침' }
                    },
                    weekend: {
                        10: { location: '집', status: '기상 및 휴식' },
                        12: { location: '집', status: '자유 시간' },
                        14: { location: '공원', status: '산책 및 여가' },
                        19: { location: '집', status: '저녁 식사' },
                        20: { location: '집', status: '자유 시간' },
                        23: { location: '집', status: '취침' }
                    }
                }
            },
            storeOwner: {
                schedule: {
                    weekday: {
                        8: { location: '집', status: '기상 및 오픈 준비' },
                        10: { location: '카페', status: '오전 영업' },
                        13: { location: '카페', status: '점심 식사 및 휴식' },
                        14: { location: '카페', status: '오후 영업' },
                        // 💥 해결책: 저녁 8시에 퇴근하여 집으로 돌아오는 스케줄 추가
                        20: { location: '집', status: '영업 종료 및 저녁 식사' },
                        21: { location: '집', status: '자유 시간' },
                        23: { location: '집', status: '취침' }
                    },
                    weekend: {
                        9: { location: '집', status: '기상 및 오픈 준비' },
                        11: { location: '카페', status: '주말 영업 시작' },
                        14: { location: '카페', status: '점심 및 재고 정리' },
                        15: { location: '카페', status: '주말 오후 영업' },
                        // 💥 해결책: 주말에도 퇴근 후 휴식 시간을 보장
                        21: { location: '집', status: '영업 종료 및 휴식' },
                        22: { location: '집', status: '자유 시간' },
                        23: { location: '집', status: '취침' }
               
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