/**
 * 100대 명산 & 트래킹 지도 (Mountain Travel Map) v2.0
 * 산림청·블랙야크 공인 100대 명산 + 나만의 산 추가 + 등산 코스 선택/추가/삭제
 */

const STORAGE_KEY = 'korea_100_mountains_records_v1';
const CUSTOM_MOUNTAINS_KEY = 'korea_custom_mountains_v1';

// 대한민국 지도 데이터 전역 바인딩 호환성 보장
if (typeof KOREA_167_GEO !== 'undefined' && typeof KOREA_MAP_167_DATA === 'undefined') {
  window.KOREA_MAP_167_DATA = KOREA_167_GEO;
}

// 100대 명산 외 대표 유명 산 GPS 사전 (자동 완성 및 스마트 좌표 지원)
const POPULAR_MOUNTAIN_PRESETS = {
  "인왕산": { lat: 37.5882, lng: 126.9609, alt: 338, region: "수도권", loc: "서울 종로구·서대문구", reason: "한양도성 성곽길과 기차바위, 서울 도심 파노라마 조망 명소", course: "사직단 ~ 범바위 ~ 인왕산 정상" },
  "청계산": { lat: 37.4452, lng: 127.0569, alt: 618, region: "수도권", loc: "서울 서초구 / 경기 성남·과천·의왕", reason: "수도권 등산객이 가장 많이 찾는 매봉·매바위 힐링 코스", course: "원터골입구 ~ 길마재 ~ 매봉 정상" },
  "아차산": { lat: 37.5539, lng: 127.0989, alt: 295, region: "수도권", loc: "서울 광진구 / 경기 구리시", reason: "한강과 서울 동부권이 한눈에 내려다보이는 해맞이 명산", course: "아차산생태공원 ~ 고구려정 ~ 해맞이광장 ~ 아차산 정상" },
  "용마산": { lat: 37.5744, lng: 127.0864, alt: 348, region: "수도권", loc: "서울 중랑구·광진구", reason: "용마폭포공원과 아차산 연계 능선 종주 인기 코스", course: "용마산역 ~ 팔각정 ~ 용마봉 정상" },
  "수락산": { lat: 37.6975, lng: 127.0811, alt: 638, region: "수도권", loc: "서울 노원구 / 경기 의정부·남양주", reason: "기암괴석과 홈통바위(기차바위) 암릉 타는 스릴 명산", course: "수락산역 ~ 염불사 ~ 깔딱고개 ~ 주봉 정상" },
  "불암산": { lat: 37.6583, lng: 127.0908, alt: 508, region: "수도권", loc: "서울 노원구 / 경기 남양주시", reason: "부처의 형상을 닮은 거대한 화강암 돔과 서울 야경 명소", course: "상계역 ~ 불암산나비정원 ~ 깔딱고개 ~ 정상" },
  "예봉산": { lat: 37.5683, lng: 127.2436, alt: 683, region: "수도권", loc: "경기 남양주시 와부읍", reason: "팔당호와 두물머리가 시원하게 펼쳐지는 강변 조망 명산", course: "팔당역 ~ 예봉산 정상 ~ 적갑산" },
  "검단산": { lat: 37.5275, lng: 127.2344, alt: 657, region: "수도권", loc: "경기 하남시·광주시", reason: "한강과 북한강 합수부 조망, 백제 검단선사의 유서", course: "애니메이션고 ~ 유길준묘 ~ 전망대 ~ 정상" },
  "광교산": { lat: 37.3486, lng: 127.0306, alt: 582, region: "수도권", loc: "경기 수원시 장안구 / 용인시 수지구", reason: "수원과 용인을 품은 부드러운 육산 능선과 시루봉", course: "경기대 ~ 형제봉 ~ 비로봉 ~ 시루봉" },
  "모락산": { lat: 37.3622, lng: 126.9856, alt: 385, region: "수도권", loc: "경기 의왕시 오전동", reason: "임진왜란 전적지이자 수려한 암릉 전망대", course: "LG아파트 ~ 모락산 국기봉 ~ 사인암" },
  "수리산": { lat: 37.3517, lng: 126.9083, alt: 489, region: "수도권", loc: "경기 군포·안양·안산", reason: "태을봉과 수암봉 칼바위 능선의 경기 도립공원", course: "산본역 ~ 산림욕장 ~ 태을봉 정상" },
  "유달산": { lat: 34.7878, lng: 126.3708, alt: 228, region: "전라권", loc: "전남 목포시 유달동", reason: "목포항과 다도해를 굽어보는 영혼의 산, 일등바위", course: "노적봉 ~ 달성각 ~ 유선각 ~ 일등바위" },
  "앞산": { lat: 35.8239, lng: 128.5833, alt: 659, region: "경상권", loc: "대구 남구 대명동", reason: "대구 도심 파노라마 전망대와 앞산 케이블카", course: "안지랑골 ~ 안일사 ~ 앞산전망대 ~ 정상" },
  "황령산": { lat: 35.1583, lng: 129.0833, alt: 427, region: "경상권", loc: "부산 부산진구·남구·연제구", reason: "광안대교와 부산 전역이 360도 펼쳐지는 황홀한 야경", course: "황령산봉수대 ~ 사자봉 ~ 바람고개" },
  "송악산": { lat: 33.2056, lng: 126.2917, alt: 104, region: "제주권", loc: "제주 서귀포시 대정읍", reason: "가파도·마라도가 손에 잡힐 듯 펼쳐지는 해안 둘레길", course: "송악산 주차장 ~ 해안절벽 탐방로 ~ 송악산 분화구" },
  "성산일출봉": { lat: 33.4586, lng: 126.9425, alt: 182, region: "제주권", loc: "제주 서귀포시 성산읍", reason: "유네스코 세계자연유산이자 바다 위 거대한 화산 분화구", course: "매표소 ~ 정상 전망대 ~ 하산 데크길" }
};

// 권역별 기본 중심 좌표
const REGION_CENTERS = {
  "수도권": { lat: 37.55, lng: 127.05 },
  "강원권": { lat: 37.75, lng: 128.35 },
  "충청권": { lat: 36.45, lng: 127.35 },
  "전라권": { lat: 35.30, lng: 127.10 },
  "경상권": { lat: 35.65, lng: 128.60 },
  "제주권": { lat: 33.38, lng: 126.55 }
};

// 상태 관리
let climbRecords = {};
let customMountains = [];
let selectedMountainId = null;
let showLabels = true;
let currentFilter = 'all';
let toastTimeout = null;

// DOM 요소
const svg = d3.select('#korea-mountain-svg');
const tooltip = document.getElementById('hover-tooltip');
const drawer = document.getElementById('detail-drawer');
const toast = document.getElementById('toast-message');

// SVG 크기 및 프로젝션 설정 (대한민국 전도 최적화)
const width = 1000;
const height = 950;

svg.attr('viewBox', `0 0 ${width} ${height}`);

const projection = d3.geoMercator()
  .center([127.75, 36.3])
  .scale(5800)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// 메인 g 컨테이너 (줌/팬 적용 대상)
const g = svg.append('g').attr('id', 'map-root');
const gLand = g.append('g').attr('class', 'land-layer');
const gMountains = g.append('g').attr('class', 'mountains-layer');
const gLabels = g.append('g').attr('class', 'labels-layer');

// 줌 동작 정의
const zoom = d3.zoom()
  .scaleExtent([1, 15])
  .on('zoom', (event) => {
    g.attr('transform', event.transform);
  });

svg.call(zoom);

// 초기화 실행
document.addEventListener('DOMContentLoaded', () => {
  loadRecords();
  loadCustomMountains();
  initMap();
  initUI();
  updateStats();
});

/**
 * 100대 명산 + 나만의 산 통합 전체 목록 반환
 */
function getAllMountains() {
  const base = (typeof MOUNTAINS_100_DATA !== 'undefined') ? MOUNTAINS_100_DATA : [];
  return [...base, ...customMountains];
}

/**
 * 로컬 스토리지 데이터 로드
 */
function loadRecords() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      climbRecords = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load climb records', e);
    climbRecords = {};
  }
}

/**
 * 나만의 산 로드
 */
function loadCustomMountains() {
  try {
    const saved = localStorage.getItem(CUSTOM_MOUNTAINS_KEY);
    if (saved) {
      customMountains = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load custom mountains', e);
    customMountains = [];
  }
}

/**
 * 로컬 스토리지 데이터 저장
 */
function saveRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(climbRecords));
    updateStats();
    updateMapPins();
  } catch (e) {
    console.error('Failed to save climb records', e);
  }
}

/**
 * 나만의 산 저장
 */
function saveCustomMountains() {
  try {
    localStorage.setItem(CUSTOM_MOUNTAINS_KEY, JSON.stringify(customMountains));
    updateStats();
    renderMountainMarkers();
  } catch (e) {
    console.error('Failed to save custom mountains', e);
  }
}

/**
 * 토스트 메시지 출력
 */
function showToast(message) {
  if (toastTimeout) clearTimeout(toastTimeout);
  document.getElementById('toast-text').textContent = message;
  toast.classList.remove('hidden');

  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2500);
}

/**
 * 마커 핀 색상 결정
 */
function getPinColor(mId) {
  const rec = climbRecords[mId];
  if (!rec || !rec.status) return 'var(--c-unvisited)';

  switch (rec.status) {
    case 'visited': return 'var(--c-visited)';
    case 'bucket': return 'var(--c-bucket)';
    default: return 'var(--c-unvisited)';
  }
}

/**
 * 지도 렌더링
 */
function initMap() {
  // 1. 대한민국 시군구 배경 레이어 렌더링
  const mapData = (typeof KOREA_MAP_167_DATA !== 'undefined') ? KOREA_MAP_167_DATA : ((typeof KOREA_167_GEO !== 'undefined') ? KOREA_167_GEO : null);
  if (mapData && mapData.features) {
    gLand.selectAll('path')
      .data(mapData.features)
      .enter()
      .append('path')
      .attr('class', 'sigungu-path')
      .attr('d', path)
      .append('title')
      .text(d => `${d.properties.fullName || d.properties.name}`);
  }

  // 2. 전체 명산 마커 핀 렌더링
  renderMountainMarkers();

  // 배경 클릭 시 서랍 닫기
  svg.on('click', () => {
    closeDrawer();
  });
}

/**
 * 마커 핀 및 라벨 전체 렌더링
 */
function renderMountainMarkers() {
  const allM = getAllMountains();

  // 1. 마커 핀
  const markers = gMountains.selectAll('.mountain-marker')
    .data(allM, d => d.id);

  markers.exit().remove();

  const enterMarkers = markers.enter()
    .append('g')
    .attr('class', 'mountain-marker')
    .attr('id', d => `mountain-${d.id}`)
    .attr('transform', d => {
      const pt = projection([d.lng, d.lat]);
      return `translate(${pt[0]}, ${pt[1]})`;
    })
    .on('mouseenter', (event, d) => handleMouseEnter(event, d))
    .on('mousemove', (event) => handleMouseMove(event))
    .on('mouseleave', () => handleMouseLeave())
    .on('click', (event, d) => {
      event.stopPropagation();
      openMountainDrawer(d.id);
    });

  enterMarkers.append('circle')
    .attr('class', 'pin-base')
    .attr('r', d => d.isCustom ? 7.5 : 6.5)
    .attr('fill', d => getPinColor(d.id))
    .attr('stroke', d => d.isCustom ? '#f59e0b' : '#ffffff')
    .attr('stroke-width', d => d.isCustom ? 2 : 1.5);

  // 기존 마커 갱신
  markers.attr('transform', d => {
    const pt = projection([d.lng, d.lat]);
    return `translate(${pt[0]}, ${pt[1]})`;
  });
  markers.select('circle.pin-base')
    .attr('fill', d => getPinColor(d.id));

  // 2. 산 이름 라벨
  const labels = gLabels.selectAll('text')
    .data(allM, d => d.id);

  labels.exit().remove();

  labels.enter()
    .append('text')
    .attr('class', 'mountain-label')
    .attr('transform', d => {
      const pt = projection([d.lng, d.lat]);
      return `translate(${pt[0]}, ${pt[1] - 9})`;
    })
    .text(d => d.name)
    .style('display', showLabels ? 'block' : 'none');

  labels.attr('transform', d => {
    const pt = projection([d.lng, d.lat]);
    return `translate(${pt[0]}, ${pt[1] - 9})`;
  })
  .style('display', showLabels ? 'block' : 'none');
}

/**
 * 마커 핀 색상 일괄 갱신
 */
function updateMapPins() {
  gMountains.selectAll('.mountain-marker circle.pin-base')
    .transition()
    .duration(250)
    .attr('fill', d => getPinColor(d.id));
}

/**
 * 마우스 호버 처리
 */
function handleMouseEnter(event, d) {
  const rec = climbRecords[d.id];
  let statusText = '⬜ 미등정';
  if (rec && rec.status) {
    if (rec.status === 'visited') statusText = '🏆 완등 인증';
    else if (rec.status === 'bucket') statusText = '🌟 가고 싶은 산';
  }

  const customBadge = d.isCustom ? ' ✨ 나만의 산' : '';
  document.getElementById('tt-name').textContent = d.name + customBadge;
  document.getElementById('tt-alt').textContent = `해발 ${d.altitude.toLocaleString()}m (${d.altName || ''})`;
  document.getElementById('tt-status').textContent = statusText;
  document.getElementById('tt-info').textContent = `${d.location} · ${d.region}`;
  document.getElementById('tt-theme').textContent = d.theme || d.reason;

  tooltip.classList.remove('hidden');
}

function handleMouseMove(event) {
  const viewport = document.getElementById('map-viewport').getBoundingClientRect();
  const x = event.clientX - viewport.left + 15;
  const y = event.clientY - viewport.top + 15;

  const maxW = viewport.width - 270;
  const maxH = viewport.height - 200;

  tooltip.style.left = `${Math.min(x, maxW)}px`;
  tooltip.style.top = `${Math.min(y, maxH)}px`;
}

function handleMouseLeave() {
  tooltip.classList.add('hidden');
}

/**
 * 상세 서랍 열기
 */
function openMountainDrawer(mId) {
  const allM = getAllMountains();
  const m = allM.find(item => item.id == mId);
  if (!m) return;

  selectedMountainId = mId;

  // 이전 선택 강조 해제 및 신규 강조
  gMountains.selectAll('.mountain-marker').classed('active-selected', false);
  d3.select(`#mountain-${mId}`).classed('active-selected', true);

  // 정보 채우기
  document.getElementById('drawer-region').textContent = m.region + (m.isCustom ? ' (나만의 산)' : '');
  document.getElementById('drawer-name').textContent = m.name;
  document.getElementById('drawer-alt-name').textContent = m.altName || '';
  document.getElementById('drawer-altitude').textContent = `${m.altitude.toLocaleString()}m`;
  document.getElementById('drawer-season').textContent = m.season || '사계절';
  document.getElementById('drawer-reason').textContent = m.reason;
  document.getElementById('drawer-location').textContent = m.location;

  // 나만의 산 삭제 버튼 토글
  const btnDeleteM = document.getElementById('btn-delete-custom-mountain');
  if (m.isCustom) {
    btnDeleteM.classList.remove('hidden');
  } else {
    btnDeleteM.classList.add('hidden');
  }

  // 기록 불러오기
  if (!climbRecords[mId]) {
    climbRecords[mId] = { 
      status: null, 
      date: '', 
      companion: '', 
      weather: '', 
      memo: '',
      selectedCourses: [],
      deletedCourseNames: [],
      customCourses: []
    };
  }
  const rec = climbRecords[mId];
  if (!rec.selectedCourses) rec.selectedCourses = [];
  if (!rec.deletedCourseNames) rec.deletedCourseNames = [];
  if (!rec.customCourses) rec.customCourses = [];

  updateDrawerStatusUI(rec.status);
  renderCoursesList(m);

  document.getElementById('climb-date-input').value = rec.date || '';
  document.getElementById('climb-companion-input').value = rec.companion || '';
  document.getElementById('climb-weather-input').value = rec.weather || '';
  document.getElementById('climb-memo').value = rec.memo || '';

  // 코스 추가 인라인 폼 닫기 및 버튼 상태 초기화
  const addCourseFormEl = document.getElementById('add-course-form');
  const btnToggleAddCourseEl = document.getElementById('btn-toggle-add-course');
  if (addCourseFormEl) addCourseFormEl.classList.add('hidden');
  if (btnToggleAddCourseEl) {
    btnToggleAddCourseEl.textContent = '+ 나만의 코스 추가';
    btnToggleAddCourseEl.classList.remove('active');
  }

  drawer.classList.remove('hidden');

  // 해당 산 위치로 부드럽게 줌인
  zoomToMountain(m);
}

/**
 * 서랍 닫기
 */
function closeDrawer() {
  drawer.classList.add('hidden');
  selectedMountainId = null;
  gMountains.selectAll('.mountain-marker').classed('active-selected', false);
}

/**
 * 해당 산 위치로 부드럽게 줌인
 */
function zoomToMountain(m) {
  const pt = projection([m.lng, m.lat]);
  const scale = 3.5;
  const translate = [width / 2 - scale * pt[0] - 80, height / 2 - scale * pt[1]];

  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}

/**
 * 서랍 내 등정 상태 UI 갱신
 */
function updateDrawerStatusUI(status) {
  const tag = document.getElementById('current-status-tag');
  const buttons = document.querySelectorAll('.status-btn-pill');

  buttons.forEach(b => b.classList.remove('active'));

  if (!status) {
    tag.className = 'meta-pill status-pill-none';
    tag.textContent = '⬜ 미등정';
    return;
  }

  const activeBtn = document.querySelector(`.status-btn-pill[data-status="${status}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  tag.className = `meta-pill status-pill-${status}`;
  if (status === 'visited') tag.textContent = '🏆 완등 인증';
  else if (status === 'bucket') tag.textContent = '🌟 가고 싶은 산';
}

/**
 * 코스명에서 네이버 지도 검색용 [지역명(시·군) + 들머리] 키워드 추출
 * 예: 금산(남해) + "복곡제2주차장 ~ 보리암" -> "남해 복곡제2주차장" (산이름 대신 시군명 검색으로 100% 인식)
 * 예: 지리산(함양) + "백무동 ~ 천왕봉" -> "함양 백무동"
 * 예: 덕숭산(예산) + "수덕사주차장 ~ 정상" -> "예산 수덕사주차장"
 * 예: 들머리 없는 경우 -> "광주 무등산 등산로"
 */
function extractTrailheadQuery(mountain, course) {
  const mName = (mountain && mountain.name) ? mountain.name : '';
  const cName = typeof course === 'string' ? course : (course ? course.name : '');
  const city = (course && course.city) ? course.city : ((mountain && mountain.city) ? mountain.city : '');

  if (!cName) {
    return city ? `${city} ${mName} 등산로` : `${mName} 등산로`;
  }

  // 1. 구분자(~, -, ->, ,, /) 기준으로 첫 번째 시작 지점 분리
  const parts = cName.split(/[~–—\->,/]/);
  let start = (parts[0] || '').trim();

  // 2. 괄호 내용 제거
  start = start.replace(/\(.*?\)/g, '').trim();

  // 3. 제1코스, 정규1코스, 완주코스, 1코스 등 들머리 없는 generic 패턴 감지 -> [지역명 산이름 등산로]로 안전 Fallback
  const isGeneric = /정규|완주|\d+코스|^제?\d+|^코스/g.test(start);
  if (isGeneric || !start) {
    return city ? `${city} ${mName} 등산로` : `${mName} 등산로`;
  }

  // 4. 사족 접미사 정제 (탐방로, 등산로, 최단, 원점회귀, 종주, 코스 등)
  start = start.replace(/탐방로|등산로|최단|원점회귀|종주|코스$/g, '').trim();

  if (!start) {
    return city ? `${city} ${mName} 등산로` : `${mName} 등산로`;
  }

  // 5. 시작 지점에 이미 지역명(city) 또는 산 이름이 포함되어 있으면 중복 방지
  if (city && start.startsWith(city)) {
    return start;
  }
  if (start.startsWith(mName)) {
    return start;
  }

  // 6. 지역명(시·군) + 들머리 키워드 결합 (예: "남해 복곡제2주차장", "예산 수덕사", "정선 장구목이")
  if (city) {
    return `${city} ${start}`;
  }

  return `${mName} ${start}`;
}

/**
 * 등산 코스 렌더링 (다녀온 코스 선택, 개별 삭제, 직접 추가 지원)
 */
function renderCoursesList(m) {
  const container = document.getElementById('courses-list');
  container.innerHTML = '';

  const rec = climbRecords[m.id];
  const selectedList = rec.selectedCourses || [];
  const deletedList = rec.deletedCourseNames || [];
  const customList = rec.customCourses || [];

  // 1. 기본 코스 중 삭제되지 않은 코스
  const baseCourses = (m.courses || []).filter(c => !deletedList.includes(c.name));
  
  // 2. 전체 활성 코스 목록
  const activeCourses = [...baseCourses, ...customList];

  // 완주 체크 카운터 갱신
  const completedCount = activeCourses.filter(c => selectedList.includes(c.name)).length;
  document.getElementById('courses-count').textContent = `(총 ${activeCourses.length}개 중 ${completedCount}개 완주 🥾)`;

  // 복원 버튼 노출 여부
  const btnReset = document.getElementById('btn-reset-courses');
  if (deletedList.length > 0 || customList.length > 0) {
    btnReset.classList.remove('hidden');
  } else {
    btnReset.classList.add('hidden');
  }

  if (activeCourses.length === 0) {
    container.innerHTML = '<div style="padding:10px;color:#94a3b8;font-size:0.78rem;text-align:center;">등록된 코스가 없습니다. 아래에서 나만의 코스를 추가해 보세요!</div>';
    return;
  }

  activeCourses.forEach((c, idx) => {
    const isCompleted = selectedList.includes(c.name);
    const item = document.createElement('div');
    item.className = `course-item ${isCompleted ? 'course-completed' : ''}`;

    const header = document.createElement('div');
    header.className = 'course-header';

    // 체크박스 & 코스명
    const checkLabel = document.createElement('label');
    checkLabel.className = 'course-check-label';
    checkLabel.title = '내가 다녀온 코스로 체크';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'course-checkbox';
    checkbox.checked = isCompleted;

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        if (!rec.selectedCourses.includes(c.name)) {
          rec.selectedCourses.push(c.name);
        }
        // 코스를 하나라도 체크하면 자동으로 완등 상태로 전환
        if (!rec.status) {
          rec.status = 'visited';
          updateDrawerStatusUI('visited');
        }
      } else {
        rec.selectedCourses = rec.selectedCourses.filter(name => name !== c.name);
      }
      saveRecords();
      renderCoursesList(m);
      showToast(checkbox.checked ? `🥾 [${c.name}] 완주 코스로 체크했습니다!` : `[${c.name}] 완주 체크를 해제했습니다.`);
    });

    const nameSpan = document.createElement('span');
    nameSpan.className = 'course-name';
    nameSpan.textContent = c.name;

    checkLabel.appendChild(checkbox);
    checkLabel.appendChild(nameSpan);

    // 우측: 난이도 뱃지 및 삭제 버튼
    const rightHeader = document.createElement('div');
    rightHeader.className = 'course-header-right';

    const diffBadge = document.createElement('span');
    diffBadge.className = `diff-badge diff-${c.difficulty || '중'}`;
    diffBadge.textContent = `난이도 ${c.difficulty || '중'}`;

    const btnDel = document.createElement('button');
    btnDel.className = 'btn-del-course';
    btnDel.title = '이 코스 삭제';
    btnDel.textContent = '✕';
    btnDel.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`'${c.name}' 코스를 삭제하시겠습니까?`)) {
        if (customList.some(item => item.name === c.name)) {
          rec.customCourses = rec.customCourses.filter(item => item.name !== c.name);
        } else {
          rec.deletedCourseNames.push(c.name);
        }
        rec.selectedCourses = rec.selectedCourses.filter(name => name !== c.name);
        saveRecords();
        renderCoursesList(m);
        showToast(`🗑️ [${c.name}] 코스를 삭제했습니다.`);
      }
    });

    rightHeader.appendChild(diffBadge);
    rightHeader.appendChild(btnDel);

    header.appendChild(checkLabel);
    header.appendChild(rightHeader);

    // 메타 정보 및 지도 링크
    const meta = document.createElement('div');
    meta.className = 'course-meta';

    const infoSpan = document.createElement('span');
    infoSpan.textContent = `거리: ${c.dist || '-'} · 소요시간: 약 ${c.time || '-'}`;

    const linksDiv = document.createElement('div');
    linksDiv.className = 'course-links';

    // 3안: 카카오맵 삭제 & 네이버 들머리 지도 단일 버튼 ([지역명(시·군) + 들머리]로 정확도 극대화)
    const trailheadQuery = extractTrailheadQuery(m, c);

    const naverLink = document.createElement('a');
    naverLink.className = 'map-btn naver-btn';
    naverLink.href = `https://map.naver.com/p/search/${encodeURIComponent(trailheadQuery)}`;
    naverLink.target = '_blank';
    naverLink.rel = 'noopener noreferrer';
    naverLink.title = `네이버 지도에서 [${trailheadQuery}] 들머리·길찾기 열기`;
    naverLink.innerHTML = `<span>📍</span> 들머리 지도`;

    linksDiv.appendChild(naverLink);

    meta.appendChild(infoSpan);
    meta.appendChild(linksDiv);

    item.appendChild(header);
    item.appendChild(meta);
    container.appendChild(item);
  });
}

/**
 * 종합 완등 통계 갱신
 */
function updateStats() {
  const allM = getAllMountains();
  const total = allM.length;
  let visitedCount = 0;
  let bucketCount = 0;
  let highPeaksCount = 0;

  Object.entries(climbRecords).forEach(([id, rec]) => {
    if (rec.status === 'visited') {
      visitedCount++;
      const m = allM.find(item => item.id == id);
      if (m && m.altitude >= 1000) highPeaksCount++;
    } else if (rec.status === 'bucket') {
      bucketCount++;
    }
  });

  const percent = total > 0 ? ((visitedCount / total) * 100).toFixed(1) : 0;

  document.getElementById('visited-count').textContent = visitedCount;
  document.getElementById('total-count').textContent = total;
  document.getElementById('visit-percent').textContent = `${percent}%`;
  document.getElementById('stat-progress-bar').style.width = `${Math.min(100, percent)}%`;

  document.getElementById('lvl-visited').textContent = visitedCount;
  document.getElementById('lvl-bucket').textContent = bucketCount;
  document.getElementById('lvl-high').textContent = highPeaksCount;
}

/**
 * UI 이벤트 핸들러 바인딩
 */
function initUI() {
  // 1. 서랍 닫기 버튼
  document.getElementById('drawer-close').addEventListener('click', closeDrawer);

  // 2. 완등 상태 버튼 클릭
  document.querySelectorAll('.status-btn-pill[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!selectedMountainId) return;
      const status = btn.getAttribute('data-status');

      if (!climbRecords[selectedMountainId]) {
        climbRecords[selectedMountainId] = { 
          status: null, date: '', companion: '', weather: '', memo: '',
          selectedCourses: [], deletedCourseNames: [], customCourses: [] 
        };
      }

      climbRecords[selectedMountainId].status = status;
      updateDrawerStatusUI(status);
      saveRecords();
    });
  });

  // 3. 등정 취소 버튼
  document.getElementById('btn-clear-status').addEventListener('click', () => {
    if (!selectedMountainId) return;
    if (climbRecords[selectedMountainId]) {
      climbRecords[selectedMountainId].status = null;
      updateDrawerStatusUI(null);
      saveRecords();
    }
  });

  // 4. 입력 필드 자동 동기화
  ['climb-date-input', 'climb-companion-input', 'climb-weather-input', 'climb-memo'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => {
      if (!selectedMountainId) return;
      if (!climbRecords[selectedMountainId]) {
        climbRecords[selectedMountainId] = { 
          status: 'visited', date: '', companion: '', weather: '', memo: '',
          selectedCourses: [], deletedCourseNames: [], customCourses: [] 
        };
      }
      const rec = climbRecords[selectedMountainId];
      rec.date = document.getElementById('climb-date-input').value;
      rec.companion = document.getElementById('climb-companion-input').value;
      rec.weather = document.getElementById('climb-weather-input').value;
      rec.memo = document.getElementById('climb-memo').value;
      saveRecords();
    });
  });

  // 5. 코스 직접 추가 및 복원 버튼 이벤트
  const btnToggleAddCourse = document.getElementById('btn-toggle-add-course');
  const addCourseForm = document.getElementById('add-course-form');
  const btnSubmitNewCourse = document.getElementById('btn-submit-new-course');
  const btnCancelNewCourse = document.getElementById('btn-cancel-new-course');
  const btnResetCourses = document.getElementById('btn-reset-courses');

  btnToggleAddCourse.addEventListener('click', () => {
    const isHidden = addCourseForm.classList.contains('hidden');
    if (isHidden) {
      addCourseForm.classList.remove('hidden');
      btnToggleAddCourse.textContent = '✕ 코스 추가 닫기';
      btnToggleAddCourse.classList.add('active');
      document.getElementById('new-course-name').focus();
    } else {
      addCourseForm.classList.add('hidden');
      btnToggleAddCourse.textContent = '+ 나만의 코스 추가';
      btnToggleAddCourse.classList.remove('active');
    }
  });

  btnCancelNewCourse.addEventListener('click', () => {
    addCourseForm.classList.add('hidden');
    btnToggleAddCourse.textContent = '+ 나만의 코스 추가';
    btnToggleAddCourse.classList.remove('active');
  });

  btnSubmitNewCourse.addEventListener('click', () => {
    if (!selectedMountainId) return;
    const name = document.getElementById('new-course-name').value.trim();
    const meta = document.getElementById('new-course-meta').value.trim();
    const diff = document.getElementById('new-course-diff').value;

    if (!name) {
      alert('코스명을 입력해 주세요.');
      return;
    }

    const rec = climbRecords[selectedMountainId];
    if (!rec.customCourses) rec.customCourses = [];
    rec.customCourses.push({
      name,
      dist: meta || '자유 거리',
      time: '직접 지정',
      difficulty: diff
    });

    document.getElementById('new-course-name').value = '';
    document.getElementById('new-course-meta').value = '';
    addCourseForm.classList.add('hidden');
    btnToggleAddCourse.textContent = '+ 나만의 코스 추가';
    btnToggleAddCourse.classList.remove('active');

    const allM = getAllMountains();
    const m = allM.find(item => item.id == selectedMountainId);
    saveRecords();
    if (m) renderCoursesList(m);
    showToast(`🥾 [${name}] 코스를 추가했습니다!`);
  });

  btnResetCourses.addEventListener('click', () => {
    if (!selectedMountainId) return;
    if (confirm('모든 기본 등산 코스를 원래대로 복원하시겠습니까? (직접 추가한 코스도 초기화됩니다)')) {
      const rec = climbRecords[selectedMountainId];
      rec.deletedCourseNames = [];
      rec.customCourses = [];
      const allM = getAllMountains();
      const m = allM.find(item => item.id == selectedMountainId);
      saveRecords();
      if (m) renderCoursesList(m);
      showToast('기본 등산 코스를 모두 복원했습니다.');
    }
  });

  // 6. 나만의 산 삭제 버튼
  document.getElementById('btn-delete-custom-mountain').addEventListener('click', () => {
    if (!selectedMountainId) return;
    const allM = getAllMountains();
    const m = allM.find(item => item.id == selectedMountainId);
    if (!m || !m.isCustom) return;

    if (confirm(`정말로 등록한 [${m.name}] 산을 지도에서 영구 삭제하시겠습니까?`)) {
      customMountains = customMountains.filter(item => item.id != selectedMountainId);
      delete climbRecords[selectedMountainId];
      saveCustomMountains();
      saveRecords();
      closeDrawer();
      showToast(`🗑️ [${m.name}] 산을 지도에서 삭제했습니다.`);
    }
  });

  // 7. 맨 하단 안심 💾 [등정 기록 저장 완료] 버튼
  const saveBtn = document.getElementById('btn-save-confirm');
  saveBtn.addEventListener('click', () => {
    if (!selectedMountainId) return;
    const allM = getAllMountains();
    const m = allM.find(item => item.id == selectedMountainId);
    const mName = m ? m.name : '해당 명산';

    if (!climbRecords[selectedMountainId]) {
      climbRecords[selectedMountainId] = { 
        status: 'visited', date: '', companion: '', weather: '', memo: '',
        selectedCourses: [], deletedCourseNames: [], customCourses: [] 
      };
    }
    const rec = climbRecords[selectedMountainId];
    rec.date = document.getElementById('climb-date-input').value;
    rec.companion = document.getElementById('climb-companion-input').value;
    rec.weather = document.getElementById('climb-weather-input').value;
    rec.memo = document.getElementById('climb-memo').value;

    // 저장 버튼 클릭 시 미등정 상태였다면 자동으로 '완등'으로 지정
    if (!rec.status) {
      rec.status = 'visited';
      updateDrawerStatusUI('visited');
    }

    saveRecords();

    // 버튼 피드백
    saveBtn.classList.add('saved-success');
    const originalHtml = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span class="save-icon">✓</span><span class="save-text">저장 완료!</span>';

    setTimeout(() => {
      saveBtn.classList.remove('saved-success');
      saveBtn.innerHTML = originalHtml;
    }, 1500);

    showToast(`✅ [${mName}] 완등 기록이 안전하게 저장되었습니다! 💾`);
  });

  // 8. 신규 산 직접 추가 모달 이벤트
  const addMountainModal = document.getElementById('add-mountain-modal');
  const btnOpenAddM = document.getElementById('btn-add-mountain-open');
  const btnCloseAddM = document.getElementById('btn-close-add-modal');
  const btnCancelAddM = document.getElementById('btn-cancel-add-mountain');
  const btnSubmitAddM = document.getElementById('btn-submit-add-mountain');
  const nameInput = document.getElementById('custom-mountain-name');
  const btnSearchHelper = document.getElementById('btn-search-mountain-info');
  const linkNaver = document.getElementById('link-naver-search');
  const linkGoogle = document.getElementById('link-google-search');

  btnOpenAddM.addEventListener('click', () => {
    addMountainModal.classList.remove('hidden');
    nameInput.focus();
  });

  [btnCloseAddM, btnCancelAddM].forEach(btn => {
    btn.addEventListener('click', () => {
      addMountainModal.classList.add('hidden');
    });
  });

  // 산 이름 입력 시 사전 매핑 & 검색 링크 자동 업데이트
  nameInput.addEventListener('input', () => {
    const val = nameInput.value.trim();
    if (val) {
      linkNaver.href = `https://map.naver.com/p/search/${encodeURIComponent(val + ' 등산로')}`;
      linkGoogle.href = `https://www.google.com/search?q=${encodeURIComponent(val + ' 등산코스')}`;

      // 사전 등록된 유명 산인 경우 자동 완성
      if (POPULAR_MOUNTAIN_PRESETS[val]) {
        const p = POPULAR_MOUNTAIN_PRESETS[val];
        document.getElementById('custom-mountain-altitude').value = p.alt;
        document.getElementById('custom-mountain-region').value = p.region;
        document.getElementById('custom-mountain-location').value = p.loc;
        document.getElementById('custom-mountain-reason').value = p.reason;
        document.getElementById('custom-mountain-course').value = p.course;
      }
    }
  });

  btnSearchHelper.addEventListener('click', () => {
    const val = nameInput.value.trim();
    if (!val) {
      alert('산 이름을 먼저 입력해 주세요.');
      return;
    }
    window.open(`https://www.google.com/search?q=${encodeURIComponent(val + ' 등산코스 해발고도')}`, '_blank');
  });

  btnSubmitAddM.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) {
      alert('산 이름을 입력해 주세요.');
      return;
    }

    const region = document.getElementById('custom-mountain-region').value;
    const alt = parseInt(document.getElementById('custom-mountain-altitude').value) || 500;
    const loc = document.getElementById('custom-mountain-location').value.trim() || region;
    const reason = document.getElementById('custom-mountain-reason').value.trim() || '내가 직접 추가한 명산';
    const courseStr = document.getElementById('custom-mountain-course').value.trim();

    // 좌표 결정 (사전 등록 여부 확인 -> 권역 중심 좌표 + 소폭 분산)
    let lat = 37.5;
    let lng = 127.0;

    if (POPULAR_MOUNTAIN_PRESETS[name]) {
      lat = POPULAR_MOUNTAIN_PRESETS[name].lat;
      lng = POPULAR_MOUNTAIN_PRESETS[name].lng;
    } else if (REGION_CENTERS[region]) {
      const c = REGION_CENTERS[region];
      // 동일 좌표 겹침 방지용 미세 랜덤 오프셋
      lat = c.lat + (Math.random() - 0.5) * 0.25;
      lng = c.lng + (Math.random() - 0.5) * 0.25;
    }

    const newCourses = courseStr ? [{ name: courseStr, dist: '추천 코스', time: '약 2시간', difficulty: '중' }] : [
      { name: `${name} 정상 코스`, dist: '3.0km', time: '1시간 30분', difficulty: '중' }
    ];

    const newId = 'custom_' + Date.now();
    const newMountain = {
      id: newId,
      isCustom: true,
      name,
      altName: '나만의 산',
      altitude: alt,
      region,
      location: loc,
      lat,
      lng,
      season: '사계절',
      theme: reason,
      reason,
      courses: newCourses
    };

    customMountains.push(newMountain);
    saveCustomMountains();

    // 폼 초기화 및 닫기
    nameInput.value = '';
    document.getElementById('custom-mountain-altitude').value = '';
    document.getElementById('custom-mountain-location').value = '';
    document.getElementById('custom-mountain-reason').value = '';
    document.getElementById('custom-mountain-course').value = '';
    addMountainModal.classList.add('hidden');

    // 서랍 바로 열기
    openMountainDrawer(newId);
    showToast(`⛰️ [${name}] 산을 지도에 성공적으로 등록했습니다! 🚀`);
  });

  // 9. 검색 기능
  const searchInput = document.getElementById('search-input');
  const searchDropdown = document.getElementById('search-dropdown');

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      searchDropdown.classList.add('hidden');
      return;
    }

    const matches = [];
    const allM = getAllMountains();

    allM.forEach(m => {
      let score = 0;
      let matchType = '';

      if (m.name.toLowerCase().includes(q)) {
        score = 10;
        matchType = '산 이름 일치';
      } else if (m.location.toLowerCase().includes(q)) {
        score = 8;
        matchType = `소재지: ${m.location}`;
      } else if (m.region.toLowerCase().includes(q)) {
        score = 6;
        matchType = `권역: ${m.region}`;
      } else if (m.season && m.season.toLowerCase().includes(q)) {
        score = 5;
        matchType = `추천 계절: ${m.season}`;
      } else if (m.theme && m.theme.toLowerCase().includes(q)) {
        score = 4;
        matchType = `특징: ${m.theme}`;
      }

      if (score > 0) {
        matches.push({ m, score, matchType });
      }
    });

    matches.sort((a, b) => b.score - a.score);

    if (!matches.length) {
      searchDropdown.innerHTML = '<div style="padding:12px;color:#64748b;font-size:0.8rem;">검색 결과가 없습니다.</div>';
      searchDropdown.classList.remove('hidden');
      return;
    }

    searchDropdown.innerHTML = '';
    matches.slice(0, 10).forEach(item => {
      const el = document.createElement('div');
      el.className = 'search-item';
      el.innerHTML = `
        <div class="search-item-title">
          <span>⛰️</span>
          <strong>${item.m.name}</strong>
          <span style="font-size:0.74rem;color:#059669;">(${item.m.altitude}m)</span>
          ${item.m.isCustom ? '<span style="font-size:0.65rem;background:#fef3c7;color:#b45309;padding:1px 4px;border-radius:4px;">나만의 산</span>' : ''}
        </div>
        <div class="search-item-sub">${item.matchType}</div>
      `;
      el.addEventListener('click', () => {
        searchDropdown.classList.add('hidden');
        searchInput.value = '';
        openMountainDrawer(item.m.id);
      });
      searchDropdown.appendChild(el);
    });

    searchDropdown.classList.remove('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.classList.add('hidden');
    }
  });

  // 10. 🎲 어디 산에 갈까? 랜덤 추천기
  document.getElementById('btn-random').addEventListener('click', () => {
    const allM = getAllMountains();
    const unclimbed = allM.filter(m => {
      const rec = climbRecords[m.id];
      return !rec || !rec.status;
    });

    if (!unclimbed.length) {
      alert('축하합니다! 등록된 모든 명산을 완등하셨습니다! 🥳🏔️');
      return;
    }

    const randM = unclimbed[Math.floor(Math.random() * unclimbed.length)];
    openMountainDrawer(randM.id);
  });

  // 11. 🏷️ 산 이름 라벨 토글
  document.getElementById('btn-toggle-labels').addEventListener('click', () => {
    showLabels = !showLabels;
    gLabels.selectAll('text').style('display', showLabels ? 'block' : 'none');
  });

  // 12. 줌 컨트롤
  document.getElementById('zoom-in').addEventListener('click', () => {
    svg.transition().duration(300).call(zoom.scaleBy, 1.4);
  });
  document.getElementById('zoom-out').addEventListener('click', () => {
    svg.transition().duration(300).call(zoom.scaleBy, 0.7);
  });
  document.getElementById('zoom-reset').addEventListener('click', () => {
    svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
  });

  // 13. 권역 필터 칩
  document.querySelectorAll('.filter-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.getAttribute('data-filter');
      currentFilter = filter;

      gMountains.selectAll('.mountain-marker')
        .transition()
        .duration(300)
        .style('opacity', d => {
          if (filter === 'all') return 1;
          const rec = climbRecords[d.id];

          if (filter === 'visited-only') {
            return (rec && rec.status === 'visited') ? 1 : 0.1;
          }
          if (filter === 'high-peaks') {
            return d.altitude >= 1000 ? 1 : 0.1;
          }

          return d.region === filter ? 1 : 0.1;
        });
    });
  });

  // 14. 백업/복원 모달
  const backupModal = document.getElementById('backup-modal');
  document.getElementById('btn-backup-modal').addEventListener('click', () => {
    backupModal.classList.remove('hidden');
  });
  document.getElementById('btn-close-modal').addEventListener('click', () => {
    backupModal.classList.add('hidden');
  });
  backupModal.addEventListener('click', (e) => {
    if (e.target === backupModal) backupModal.classList.add('hidden');
  });

  // JSON 다운로드 (완등 기록 + 나만의 산 통합 백업)
  document.getElementById('btn-download-json').addEventListener('click', () => {
    const backupData = {
      records: climbRecords,
      customMountains: customMountains,
      exportedAt: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `korea-mountains-backup-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  });

  // JSON 복원
  document.getElementById('json-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed && typeof parsed === 'object') {
          if (parsed.records) {
            climbRecords = parsed.records;
            customMountains = parsed.customMountains || [];
          } else {
            climbRecords = parsed;
          }
          saveRecords();
          saveCustomMountains();
          alert('100대 명산 완등 기록과 나만의 산 데이터를 성공적으로 복원했습니다!');
          backupModal.classList.add('hidden');
        }
      } catch (err) {
        alert('올바른 JSON 백업 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
  });

  // 데이터 초기화
  document.getElementById('btn-reset-data').addEventListener('click', () => {
    if (confirm('정말로 모든 완등 기록과 등록한 나만의 산을 초기화하시겠습니까? (되돌릴 수 없습니다)')) {
      climbRecords = {};
      customMountains = [];
      saveRecords();
      saveCustomMountains();
      backupModal.classList.add('hidden');
      alert('모든 등정 기록이 초기화되었습니다.');
    }
  });

  // 15. 📸 고화질 완등 지도 이미지 내보내기 (PNG)
  document.getElementById('btn-export-image').addEventListener('click', exportMapAsImage);
}

/**
 * 고화질 PNG 지도 다운로드
 */
function exportMapAsImage() {
  const svgElement = document.getElementById('korea-mountain-svg');
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);

  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');

  // 청명한 바다빛 채우기
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 24px Pretendard, sans-serif';
    ctx.fillStyle = '#065f46';
    ctx.fillText('대한민국 100대 명산 완등 지도 (Mountain Travel Map)', 40, canvas.height - 40);

    const a = document.createElement('a');
    a.download = `korea-100-mountains-map-${new Date().toISOString().slice(0,10)}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    URL.revokeObjectURL(url);
  };

  img.src = url;
}
