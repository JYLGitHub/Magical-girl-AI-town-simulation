const locations = {
    // 개인 주거지
    "조루디의 반지하 원룸": {
        description: "깔끔하고 체계적으로 정리된 반지하 원룸. 책장이 주제별로 정리되어 있고, 작업 데스크가 중심. 최소한의 가구지만 각각이 다기능적이며, 따뜻한 조명과 작은 식물 몇 개로 아늑함을 연출한다.",
        capacity: 3,
        type: "residential"
    },
    "민도저의 투룸 오피스텔": {
        description: "실용적이면서도 활동적인 느낌의 투룸 오피스텔. 운동용품이 한쪽 구석에 정리되어 있고, 벽에는 목표와 계획이 적힌 화이트보드. 깔끔하지만 살짝 바쁜 사람의 흔적이 보이며, 공용 공간은 언제든 사람을 초대할 수 있게 정돈되어 있다.",
        capacity: 3,
        type: "residential"
    },
    "구선달의 원룸": {
        description: "예술적 감각이 돋보이는 원룸. 빈티지 소품과 작품들이 조화롭게 배치되어 있고, 작업 공간과 휴식 공간이 미묘하게 분리되어 있다. 조명에 특히 신경 써서 분위기가 수시로 바뀔 수 있게 설계했으며, 혼자만의 시간을 위한 아늑한 코너가 있다.",
        capacity: 3, 
        type: "residential"
    },
    
    // 공용 장소
    "university": {
        description: "죠르디, 미니도저, 구선달이 다니는 종합대학교",
        capacity: 20,
        type: "educational"
    },
    "library": {
        description: "대학교 중앙도서관, 조용하고 학술적인 분위기",
        capacity: 12,
        type: "educational"
    },
    "school": {
        description: "종합대학교 가까이에 있는 고등학교",
        capacity: 20,
        type: "educational"
    },
    "cafe": {
        description: "대학가 근처 아늑한 분위기의 카페, 학생들이 자주 찾는 곳",
        capacity: 8,
        type: "commercial"
    },
    "student_council": {
        description: "대학교 학생회실, 미니도저의 주요 활동 공간",
        capacity: 6,
        type: "educational"
    },
    "gym": {
        description: "격투기와 헬스가 가능한 종합 체육시설",
        capacity: 10,
        type: "commercial"
    },
    "art_studio": {
        description: "미술대학 작업실, 개인 창작 공간",
        capacity: 4,
        type: "educational"
    },
    "gallery": {
        description: "현대미술 전시가 열리는 소규모 갤러리",
        capacity: 6,
        type: "cultural"
    },
    "restaurant": {
        description: "대학가 근처 인기 있는 가족 경영 식당",
        capacity: 8,
        type: "commercial"
    },
    "park": {
        description: "대학 근처 조용한 도시공원, 산책과 휴식 공간",
        capacity: 15,
        type: "public"
    },
    "vintage_shop": {
        description: "독특한 빈티지 소품과 의류를 파는 작은 상점",
        capacity: 4,
        type: "commercial"
    }
};
const scenarios = {
    modern: {
        worldName: "현대 도시",
        locations: ["home", "school", "university", "library", "cafe", "student_council", "gym", "art_studio", "gallery", "restaurant", "park", "vintage_shop"],
        archetypes: {
            student: {
                schedule: {
                    "조루디": {
                        monday: {
                        9: { location: "library", status: "도서관 연구" },
                        13: { location: "university", status: "대학원 세미나" },
                        16: { location: "home", status: "프리랜서 리서치 작업" },
                        19: { location: "home", status: "저녁 식사" },
                        22: { location: "home", status: "개인 연구 및 논문 작성" }
                        },
                        tuesday: {
                        10: { location: "university", status: "지도교수 미팅" },
                        14: { location: "home", status: "프리랜서 프로젝트" },
                        18: { location: "home", status: "저녁 식사" },
                        20: { location: "home", status: "자유 시간" },
                        23: { location: "home", status: "독서 및 연구" }
                        },
                        wednesday: {
                        9: { location: "university", status: "대학원 수업" },
                        13: { location: "cafe", status: "점심 및 휴식" },
                        15: { location: "library", status: "도서관 작업" },
                        19: { location: "home", status: "저녁 식사" },
                        22: { location: "home", status: "집중 연구 시간" }
                        },
                        thursday: {
                        10: { location: "cafe", status: "프리랜서 클라이언트 미팅" },
                        14: { location: "library", status: "연구 작업" },
                        18: { location: "home", status: "저녁 식사" },
                        21: { location: "home", status: "논문 작성" }
                        },
                        friday: {
                        9: { location: "university", status: "대학원 세미나" },
                        13: { location: "home", status: "프로젝트 마무리" },
                        16: { location: "cafe", status: "자유 시간" },
                        19: { location: "home", status: "저녁 식사" }
                        },
                        saturday: {
                        10: { location: "home", status: "집 정리 및 휴식" },
                        13: { location: "home", status: "자유 시간" },
                        17: { location: "home", status: "요리 및 저녁" },
                        20: { location: "home", status: "여유로운 독서" }
                        },
                        sunday: {
                        9: { location: "park", status: "산책 및 명상" },
                        12: { location: "home", status: "자유 시간" },
                        16: { location: "home", status: "다음 주 계획 세우기" },
                        19: { location: "home", status: "휴식" }
                        }
                    },
                    "민도저": {
                        monday: {
                        9: { location: "university", status: "대학교 수업" },
                        13: { location: "university", status: "점심" },
                        14: { location: "student_council", status: "학생회 업무" },
                        18: { location: "gym", status: "복싱 수업" },
                        21: { location: "home", status: "과제 및 자유 시간" }
                        },
                        tuesday: {
                        10: { location: "university", status: "대학교 수업" },
                        14: { location: "student_council", status: "학생회 회의" },
                        17: { location: "university", status: "동아리 활동" },
                        20: { location: "home", status: "저녁 식사" },
                        23: { location: "home", status: "과제" }
                        },
                        wednesday: {
                        9: { location: "university", status: "대학교 수업" },
                        13: { location: "student_council", status: "학생회 프로젝트" },
                        16: { location: "cafe", status: "자유 시간" },
                        19: { location: "gym", status: "킥복싱 수업" },
                        22: { location: "home", status: "개인 시간" }
                        },
                        thursday: {
                        10: { location: "university", status: "대학교 수업" },
                        14: { location: "student_council", status: "학생회 업무" },
                        18: { location: "restaurant", status: "친구들과 저녁" },
                        21: { location: "home", status: "과제 및 자유 시간" }
                        ,
                        friday: {
                        9: { location: "university", status: "대학교 수업" },
                        13: { location: "student_council", status: "학생회 마무리 업무" },
                        16: { location: "home", status: "자유 시간" },
                        19: { location: "restaurant", status: "친구들과 시간" }
                        },
                        saturday: {
                        10: { location: "gym", status: "운동 (헬스장)" },
                        13: { location: "home", status: "자유 시간" },
                        17: { location: "home", status: "요리 및 정리" },
                        21: { location: "home", status: "개인 시간" }
                        },
                        sunday: {
                        9: { location: "gym", status: "운동" },
                        12: { location: "home", status: "휴식 및 자유 시간" },
                        16: { location: "student_council", status: "다음 주 학생회 준비" },
                        19: { location: "home", status: "휴식" }
                        }
                    },
                    },
                    "구선달": {
                        monday: {
                        10: { location: "university", status: "미술대학 수업" },
                        14: { location: "art_studio", status: "작업실에서 개인 작업" },
                        17: { location: "cafe", status: "자유 시간" },
                        20: { location: "home", status: "콘텐츠 제작" }
                        },
                        tuesday: {
                        9: { location: "university", status: "미술대학 수업" },
                        13: { location: "cafe", status: "점심 및 휴식" },
                        15: { location: "art_studio", status: "개인 작업" },
                        19: { location: "gallery", status: "갤러리 탐방" },
                        22: { location: "home", status: "개인 시간" }
                        },
                        wednesday: {
                        10: { location: "university", status: "미술대학 수업" },
                        14: { location: "art_studio", status: "졸업 작품 준비" },
                        18: { location: "cafe", status: "자유 시간" },
                        21: { location: "home", status: "콘텐츠 제작" }
                        ,
                        thursday: {
                        9: { location: "university", status: "미술대학 수업" },
                        13: { location: "art_studio", status: "작업실 작업" },
                        17: { location: "cafe", status: "카페에서 휴식" },
                        20: { location: "home", status: "개인 시간" }
                        },
                        friday: {
                        10: { location: "university", status: "미술대학 수업" },
                        14: { location: "university", status: "교수님 미팅" },
                        17: { location: "home", status: "자유 시간" },
                        21: { location: "restaurant", status: "친구들과 시간" }
                        },
                        saturday: {
                        11: { location: "home", status: "개인 작업 (집중 시간)" },
                        15: { location: "vintage_shop", status: "빈티지 소품 쇼핑" },
                        18: { location: "home", status: "자유 시간" },
                        21: { location: "home", status: "독서 및 영화 감상" }
                        },
                        sunday: {
                        10: { location: "park", status: "명상 및 산책" },
                        13: { location: "home", status: "완전한 혼자 시간" },
                        17: { location: "art_studio", status: "작업실 정리" },
                        20: { location: "home", status: "다음 주 계획" }
                        }
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
                }
            },
            academic: {
                schedule: {
                        monday: {
                            6: { location: 'home', status: '기상 및 아침 준비' },
                            9: { location: 'school', status: '오전 수업' },
                            12: { location: 'school', status: '점심 식사' },
                            14: { location: 'school', status: '오후 수업' },
                            18: { location: 'home', status: '저녁 식사' },
                            19: { location: 'home', status: '자유 시간' },
                            23: { location: 'home', status: '취침' }
                        },
                        tuesday: {
                            6: { location: 'home', status: '기상 및 아침 준비' },
                            9: { location: 'school', status: '오전 수업' },
                            12: { location: 'school', status: '점심 식사' },
                            14: { location: 'school', status: '오후 수업' },
                            18: { location: 'home', status: '저녁 식사' },
                            19: { location: 'home', status: '숙제 및 공부' },
                            23: { location: 'home', status: '취침' }
                        },
                        wednesday: {
                            6: { location: 'home', status: '기상 및 아침 준비' },
                            9: { location: 'school', status: '오전 수업' },
                            12: { location: 'school', status: '점심 식사' },
                            14: { location: 'school', status: '오후 수업' },
                            18: { location: 'home', status: '저녁 식사' },
                            19: { location: 'home', status: '자유 시간' },
                            23: { location: 'home', status: '취침' }
                        },
                        thursday: {
                            6: { location: 'home', status: '기상 및 아침 준비' },
                            9: { location: 'school', status: '오전 수업' },
                            12: { location: 'school', status: '점심 식사' },
                            14: { location: 'school', status: '오후 수업' },
                            18: { location: 'home', status: '저녁 식사' },
                            19: { location: 'home', status: '숙제 및 공부' },
                            23: { location: 'home', status: '취침' }
                        },
                        friday: {
                            6: { location: 'home', status: '기상 및 아침 준비' },
                            9: { location: 'school', status: '오전 수업' },
                            12: { location: 'school', status: '점심 식사' },
                            14: { location: 'school', status: '오후 수업' },
                            18: { location: 'home', status: '저녁 식사' },
                            19: { location: 'home', status: '자유 시간' },
                            23: { location: 'home', status: '취침' }
                        },
                        saturday: {
                            9: { location: 'home', status: '늦잠' },
                            11: { location: 'home', status: '자유 시간' },
                            13: { location: 'home', status: '점심 식사' },
                            15: { location: 'home', status: '자유 시간' },
                            18: { location: 'home', status: '저녁 식사' },
                            20: { location: 'home', status: '자유 시간' },
                            23: { location: 'home', status: '취침' }
                        },
                        sunday: {
                            9: { location: 'home', status: '늦잠' },
                            11: { location: 'home', status: '자유 시간' },
                            13: { location: 'home', status: '점심 식사' },
                            15: { location: 'home', status: '자유 시간' },
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