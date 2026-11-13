(function () {
const neighborhoods = {
  "전체": [],
  "중산동": ["중산자이 1단지", "중산자이 2단지", "중산코오롱하늘채더퍼스트", "펜타힐즈 더샵 1차", "펜타힐즈 더샵 2차", "힐스테이트 펜타힐즈"],
  "정평동": ["정평역 하늘채 RIVER PARK", "경산 우방맨션 3차", "한솔 1차"],
  "옥산동": ["옥산 태왕한라타운", "옥산 신화평광", "협화타운"],
  "옥곡동": ["옥곡 우방유쉘", "경산 한신휴플러스", "부영조은마을"],
  "사동": ["사동 팰리스 부영 1단지", "사동 팰리스 부영 2단지", "경산 푸르지오"],
  "백천동": ["백천 신나리", "백천 월드메르디앙", "윤성 2차"],
  "계양동": ["계양 주공", "경산 서한이다음"],
  "압량읍": ["경산 코아루", "부적 주공", "경산 푸르지오"],
  "하양읍": ["경산 하양 금호어울림", "하양 우미린 에코포레", "하양 코아루 3차"],
  "진량읍": ["경산 진량 호반베르디움", "초원장미타운", "진량 우방힐타운"],
  "자인면": ["자인 서부주공", "자인 동부주택"]
};

const complexes = [
  { id: 1, name: "중산자이 1단지", dong: "중산동", address: "경산시 중산동 705", lat: 35.8267, lng: 128.7183, households: 1144, year: 2023, area: "84㎡", sale: 63500, lease: 39000, monthly: 125, change: 3.8, deals: 12, school: "성암초 도보 7분", transit: "정평역 차량 6분", life: "펜타힐즈 상권 도보권", supply: "입주 3년차·대단지" },
  { id: 2, name: "펜타힐즈 더샵 2차", dong: "중산동", address: "경산시 중산동 695", lat: 35.8281, lng: 128.7206, households: 791, year: 2018, area: "84㎡", sale: 59800, lease: 36500, monthly: 118, change: 2.1, deals: 9, school: "성암초 도보 9분", transit: "정평역 차량 7분", life: "대형마트·상업시설 인접", supply: "브랜드 선호·중산지구" },
  { id: 3, name: "힐스테이트 펜타힐즈", dong: "중산동", address: "경산시 중산동 693", lat: 35.8294, lng: 128.7224, households: 657, year: 2021, area: "84㎡", sale: 57200, lease: 35000, monthly: 115, change: 1.6, deals: 8, school: "성암초 도보 10분", transit: "정평역 차량 7분", life: "펜타힐즈 중심상권", supply: "신축 브랜드 단지" },
  { id: 4, name: "정평역 하늘채 RIVER PARK", dong: "정평동", address: "경산시 정평동 255-35", lat: 35.8342, lng: 128.7271, households: 904, year: 2020, area: "84㎡", sale: 52800, lease: 33500, monthly: 105, change: 1.2, deals: 7, school: "정평초 도보 8분", transit: "정평역 도보 4분", life: "지하철·생활편의 우수", supply: "역세권·금호강 생활권" },
  { id: 5, name: "경산 하양 금호어울림", dong: "하양읍", address: "경산시 하양읍 서사리 288", lat: 35.9133, lng: 128.8168, households: 626, year: 2023, area: "84㎡", sale: 44200, lease: 28500, monthly: 92, change: 4.2, deals: 10, school: "하주초 도보 8분", transit: "하양역 차량 7분", life: "하양지구 신도시 생활권", supply: "신축·지식산업지구 배후" },
  { id: 6, name: "하양 우미린 에코포레", dong: "하양읍", address: "경산시 하양읍 서사리 241", lat: 35.9104, lng: 128.8197, households: 787, year: 2022, area: "84㎡", sale: 42800, lease: 27500, monthly: 90, change: 2.9, deals: 9, school: "하주초 도보 6분", transit: "하양역 차량 8분", life: "근린공원·신규상권", supply: "대단지 신축" },
  { id: 7, name: "경산 진량 호반베르디움", dong: "진량읍", address: "경산시 진량읍 선화리 2205", lat: 35.8727, lng: 128.8249, households: 549, year: 2019, area: "84㎡", sale: 33700, lease: 23000, monthly: 78, change: 0.8, deals: 6, school: "진량초 차량 6분", transit: "경산IC 차량 9분", life: "진량산단 배후수요", supply: "직주근접 중심" },
  { id: 8, name: "옥곡 우방유쉘", dong: "옥곡동", address: "경산시 옥곡동 823-1", lat: 35.8157, lng: 128.7305, households: 445, year: 2006, area: "84㎡", sale: 32400, lease: 22000, monthly: 75, change: -0.4, deals: 5, school: "옥곡초 도보 5분", transit: "경산역 차량 7분", life: "마트·의료시설 인접", supply: "초품아·안정적 생활권" },
  { id: 9, name: "사동 팰리스 부영 1단지", dong: "사동", address: "경산시 사동 21", lat: 35.8122, lng: 128.7546, households: 630, year: 2007, area: "84㎡", sale: 28600, lease: 20500, monthly: 72, change: 0.3, deals: 7, school: "사동초 도보 6분", transit: "경산시청 차량 8분", life: "사동 생활권·공원 인접", supply: "실수요 중심 대단지" },
  { id: 10, name: "백천 월드메르디앙", dong: "백천동", address: "경산시 백천동 571-3", lat: 35.8039, lng: 128.7387, households: 667, year: 2005, area: "84㎡", sale: 27800, lease: 19500, monthly: 68, change: -0.7, deals: 4, school: "백천초 도보 4분", transit: "경산역 차량 9분", life: "백천 생활상권", supply: "초품아·중형 대단지" },
  { id: 11, name: "중산코오롱하늘채더퍼스트", dong: "중산동", address: "경산시 경산로 280 (중산동 693)", lat: 35.833764, lng: 128.724573, households: 1184, year: 2021, area: "84㎡", sale: 51000, lease: 32000, monthly: 105, change: 1.9, deals: 8, school: "경산서부초 도보 약 14분", transit: "정평역 도보권", life: "중산·정평 생활상권 인접", supply: "12개동·1,184세대 대단지" }
];

const seedListings = [
  { id: "L1", complexId: 1, badge: "급매", title: "중산자이 1단지 남향 로열층", price: "매매 6억 1,000", meta: "84㎡ · 18층 · 남향", note: "입주 협의 · 시스템에어컨", color: "mint" },
  { id: "L2", complexId: 4, badge: "역세권", title: "정평역 하늘채 탁 트인 강변뷰", price: "전세 3억 3,000", meta: "84㎡ · 12층 · 남동향", note: "정평역 도보 4분 · 즉시 입주", color: "blue" },
  { id: "L3", complexId: 5, badge: "신축", title: "하양 금호어울림 첫 입주급", price: "매매 4억 2,000", meta: "84㎡ · 9층 · 남향", note: "확장형 · 단지 안쪽 조용한 동", color: "amber" },
  { id: "L4", complexId: 9, badge: "실속", title: "사동 팰리스 부영 올수리", price: "월세 2,000 / 75", meta: "84㎡ · 7층 · 남서향", note: "도배·장판 완료 · 반려동물 협의", color: "violet" }
];

const formatPrice = value => {
  const eok = Math.floor(value / 10000);
  const man = value % 10000;
  return eok ? `${eok}억${man ? ` ${man.toLocaleString()}만` : ""}` : `${value.toLocaleString()}만`;
};

const detailAliases = {
  "중산자이 1단지": 1,
  "펜타힐즈 더샵 2차": 2,
  "힐스테이트 펜타힐즈": 3,
  "정평역하늘채 RIVER PARK": 4,
  "경산하양 금호어울림": 5,
  "경산하양 우미린 에코포레": 6,
  "경산진량 호반써밋 더 포레스트": 7,
  "경산 우방유쉘": 8,
  "팰리스부영1단지": 9,
  "경산백천월드메르디앙": 10,
  "중산 하늘채 더퍼스트": 11
};

const officialCatalog = window.gyeongsanApartmentCatalog || [];
const allComplexes = officialCatalog.map(entry => {
  const detailId = detailAliases[entry.name];
  const detail = complexes.find(complex => complex.id === detailId);
  if (detail) {
    return { ...entry, ...detail, id: detail.id, name: entry.name, dong: entry.dong, address: entry.address, road: entry.road, households: entry.households, year: entry.year, official: true };
  }
  return {
    ...entry,
    area: "면적별 조회",
    sale: null,
    lease: null,
    monthly: null,
    change: null,
    deals: 0,
    lat: null,
    lng: null,
    school: "공식 단지정보 기준",
    transit: "상세 교통정보 확인 필요",
    life: "주변 생활시설 확인 필요",
    supply: `${entry.households.toLocaleString()}세대 · ${entry.year}년 승인`,
    official: true
  };
});

const completeNeighborhoods = { "전체": [] };
allComplexes.forEach(complex => {
  (completeNeighborhoods[complex.dong] ||= []).push(complex.name);
});

window.dashboardData = { neighborhoods: completeNeighborhoods, complexes: allComplexes, seedListings, formatPrice };
})();
