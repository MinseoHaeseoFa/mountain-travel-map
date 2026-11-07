/**
 * 100대 명산 & 트래킹 지도 (Mountain Travel Map) v1.0
 * 산림청·블랙야크 공인 대한민국 100대 명산 인터랙티브 완등 아카이브
 */

const STORAGE_KEY = 'korea_100_mountains_records_v1';

// 대한민국 지도 데이터 전역 바인딩 호환성 보장
if (typeof KOREA_167_GEO !== 'undefined' && typeof KOREA_MAP_167_DATA === 'undefined') {
  window.KOREA_MAP_167_DATA = KOREA_167_GEO;
}

// 상태 관리
let climbRecords = {};
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
  initMap();
  initUI();
  updateStats();
});

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

  // 2. 100대 명산 마커 핀 렌더링
  if (typeof MOUNTAINS_100_DATA !== 'undefined') {
    const markers = gMountains.selectAll('.mountain-marker')
      .data(MOUNTAINS_100_DATA)
      .enter()
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

    // 핀 베이스 원형
    markers.append('circle')
      .attr('class', 'pin-base')
      .attr('r', 6.5)
      .attr('fill', d => getPinColor(d.id));

    // 3. 산 이름 라벨 레이어
    gLabels.selectAll('text')
      .data(MOUNTAINS_100_DATA)
      .enter()
      .append('text')
      .attr('class', 'mountain-label')
      .attr('transform', d => {
        const pt = projection([d.lng, d.lat]);
        return `translate(${pt[0]}, ${pt[1] - 9})`;
      })
      .text(d => d.name)
      .style('display', showLabels ? 'block' : 'none');
  }

  // 배경 클릭 시 서랍 닫기
  svg.on('click', () => {
    closeDrawer();
  });
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

  document.getElementById('tt-name').textContent = d.name;
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
  const m = MOUNTAINS_100_DATA.find(item => item.id === mId);
  if (!m) return;

  selectedMountainId = mId;

  // 이전 선택 강조 해제 및 신규 강조
  gMountains.selectAll('.mountain-marker').classed('active-selected', false);
  d3.select(`#mountain-${mId}`).classed('active-selected', true);

  // 정보 채우기
  document.getElementById('drawer-region').textContent = m.region;
  document.getElementById('drawer-name').textContent = m.name;
  document.getElementById('drawer-alt-name').textContent = m.altName || '';
  document.getElementById('drawer-altitude').textContent = `${m.altitude.toLocaleString()}m`;
  document.getElementById('drawer-season').textContent = m.season || '사계절';
  document.getElementById('drawer-reason').textContent = m.reason;
  document.getElementById('drawer-location').textContent = m.location;

  // 기록 불러오기
  if (!climbRecords[mId]) {
    climbRecords[mId] = { status: null, date: '', companion: '', weather: '', memo: '' };
  }
  const rec = climbRecords[mId];

  updateDrawerStatusUI(rec.status);
  renderCoursesList(m);

  document.getElementById('climb-date-input').value = rec.date || '';
  document.getElementById('climb-companion-input').value = rec.companion || '';
  document.getElementById('climb-weather-input').value = rec.weather || '';
  document.getElementById('climb-memo').value = rec.memo || '';

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
 * 대표 등산 코스 렌더링
 */
function renderCoursesList(m) {
  const container = document.getElementById('courses-list');
  container.innerHTML = '';

  const courses = m.courses || [];
  document.getElementById('courses-count').textContent = `(${courses.length}개 코스)`;

  courses.forEach(c => {
    const item = document.createElement('div');
    item.className = 'course-item';

    const header = document.createElement('div');
    header.className = 'course-header';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'course-name';
    nameSpan.textContent = c.name;

    const diffBadge = document.createElement('span');
    diffBadge.className = `diff-badge diff-${c.difficulty}`;
    diffBadge.textContent = `난이도 ${c.difficulty}`;

    header.appendChild(nameSpan);
    header.appendChild(diffBadge);

    const meta = document.createElement('div');
    meta.className = 'course-meta';

    const infoSpan = document.createElement('span');
    infoSpan.textContent = `거리: ${c.dist} · 소요시간: 약 ${c.time}`;

    const linksDiv = document.createElement('div');
    linksDiv.className = 'course-links';

    const naverLink = document.createElement('a');
    naverLink.className = 'map-btn naver-btn';
    naverLink.href = `https://map.naver.com/p/search/${encodeURIComponent(m.name + ' ' + c.name)}`;
    naverLink.target = '_blank';
    naverLink.rel = 'noopener';
    naverLink.textContent = '네이버 지도';

    const kakaoLink = document.createElement('a');
    kakaoLink.className = 'map-btn kakao-btn';
    kakaoLink.href = `https://map.kakao.com/?q=${encodeURIComponent(m.name + ' ' + c.name)}`;
    kakaoLink.target = '_blank';
    kakaoLink.rel = 'noopener';
    kakaoLink.textContent = '카카오맵';

    linksDiv.appendChild(naverLink);
    linksDiv.appendChild(kakaoLink);

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
  const total = 100;
  let visitedCount = 0;
  let bucketCount = 0;
  let highPeaksCount = 0;

  Object.entries(climbRecords).forEach(([id, rec]) => {
    if (rec.status === 'visited') {
      visitedCount++;
      const m = MOUNTAINS_100_DATA.find(item => item.id === parseInt(id));
      if (m && m.altitude >= 1000) highPeaksCount++;
    } else if (rec.status === 'bucket') {
      bucketCount++;
    }
  });

  const percent = ((visitedCount / total) * 100).toFixed(1);

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
        climbRecords[selectedMountainId] = { status: null, date: '', companion: '', weather: '', memo: '' };
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
        climbRecords[selectedMountainId] = { status: 'visited', date: '', companion: '', weather: '', memo: '' };
      }
      const rec = climbRecords[selectedMountainId];
      rec.date = document.getElementById('climb-date-input').value;
      rec.companion = document.getElementById('climb-companion-input').value;
      rec.weather = document.getElementById('climb-weather-input').value;
      rec.memo = document.getElementById('climb-memo').value;
      saveRecords();
    });
  });

  // 5. 맨 하단 안심 💾 [등정 기록 저장 완료] 버튼
  const saveBtn = document.getElementById('btn-save-confirm');
  saveBtn.addEventListener('click', () => {
    if (!selectedMountainId) return;
    const m = MOUNTAINS_100_DATA.find(item => item.id === selectedMountainId);
    const mName = m ? m.name : '해당 명산';

    if (!climbRecords[selectedMountainId]) {
      climbRecords[selectedMountainId] = { status: 'visited', date: '', companion: '', weather: '', memo: '' };
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

  // 6. 검색 기능
  const searchInput = document.getElementById('search-input');
  const searchDropdown = document.getElementById('search-dropdown');

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      searchDropdown.classList.add('hidden');
      return;
    }

    const matches = [];
    MOUNTAINS_100_DATA.forEach(m => {
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

  // 7. 🎲 어디 산에 갈까? 랜덤 추천기
  document.getElementById('btn-random').addEventListener('click', () => {
    const unclimbed = MOUNTAINS_100_DATA.filter(m => {
      const rec = climbRecords[m.id];
      return !rec || !rec.status;
    });

    if (!unclimbed.length) {
      alert('축하합니다! 대한민국 100대 명산을 모두 완등하셨습니다! 🥳🏔️');
      return;
    }

    const randM = unclimbed[Math.floor(Math.random() * unclimbed.length)];
    openMountainDrawer(randM.id);
  });

  // 8. 🏷️ 산 이름 라벨 토글
  document.getElementById('btn-toggle-labels').addEventListener('click', () => {
    showLabels = !showLabels;
    gLabels.selectAll('text').style('display', showLabels ? 'block' : 'none');
  });

  // 9. 줌 컨트롤
  document.getElementById('zoom-in').addEventListener('click', () => {
    svg.transition().duration(300).call(zoom.scaleBy, 1.4);
  });
  document.getElementById('zoom-out').addEventListener('click', () => {
    svg.transition().duration(300).call(zoom.scaleBy, 0.7);
  });
  document.getElementById('zoom-reset').addEventListener('click', () => {
    svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
  });

  // 10. 권역 필터 칩
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

  // 11. 백업/복원 모달
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

  // JSON 다운로드
  document.getElementById('btn-download-json').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(climbRecords, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `korea-100-mountains-backup-${new Date().toISOString().slice(0,10)}.json`);
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
        if (typeof parsed === 'object') {
          climbRecords = parsed;
          saveRecords();
          alert('100대 명산 완등 기록 데이터를 성공적으로 복원했습니다!');
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
    if (confirm('정말로 모든 100대 명산 등정 기록을 초기화하시겠습니까? (되돌릴 수 없습니다)')) {
      climbRecords = {};
      saveRecords();
      backupModal.classList.add('hidden');
      alert('모든 완등 기록이 초기화되었습니다.');
    }
  });

  // 12. 📸 고화질 완등 지도 이미지 내보내기 (PNG)
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
