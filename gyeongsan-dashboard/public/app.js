const { neighborhoods, complexes, seedListings, formatPrice } = window.dashboardData;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const initialComplex = complexes.find(complex => Number.isFinite(complex.sale)) || complexes[0];
const state = { period: "week", type: "sale", dong: "전체", apartment: "전체", selected: initialComplex, listings: loadListings(), liveItems: [] };

function loadListings() {
  try { return [...seedListings, ...JSON.parse(localStorage.getItem("luckyListings") || "[]")]; }
  catch { return [...seedListings]; }
}

function isoDate(date) { return date.toISOString().slice(0, 10); }
function setDates(period = state.period) {
  const end = new Date();
  const start = new Date(end);
  if (period === "week") start.setDate(end.getDate() - 7);
  if (period === "month") start.setMonth(end.getMonth() - 1);
  $("#endDate").value = isoDate(end);
  $("#startDate").value = isoDate(start);
}

function initSelects() {
  const dongs = Object.keys(neighborhoods).sort((a, b) => a === "전체" ? -1 : b === "전체" ? 1 : a.localeCompare(b, "ko"));
  $("#dongSelect").replaceChildren(...dongs.map(dong => new Option(dong === "전체" ? `경산시 전체 · ${complexes.length}개 단지` : `${dong} · ${complexes.filter(c => c.dong === dong).length}개`, dong)));
  $("#formComplex").replaceChildren(...complexes.map(c => new Option(`${c.dong} · ${c.name}`, String(c.id))));
  updateApartmentOptions();
}

function updateApartmentOptions() {
  const rows = (state.dong === "전체" ? complexes : complexes.filter(c => c.dong === state.dong))
    .slice().sort((a, b) => a.name.localeCompare(b.name, "ko"));
  $("#aptSelect").replaceChildren(
    new Option(`전체 아파트 · ${rows.length}개`, "전체"),
    ...rows.map(c => new Option(`${c.name} · ${c.households.toLocaleString()}세대`, String(c.id)))
  );
}

function visibleComplexes() {
  let rows = state.dong === "전체" ? complexes : complexes.filter(c => c.dong === state.dong);
  if (state.apartment !== "전체") rows = rows.filter(c => String(c.id) === String(state.apartment));
  return rows.length ? rows : complexes;
}

function renderKpis() {
  const rows = visibleComplexes().filter(row => Number.isFinite(row.sale) && Number.isFinite(row.lease));
  if (!rows.length) {
    $("#avgSale").textContent = "실거래 조회";
    $("#avgLease").textContent = "실거래 조회";
    $("#leaseRatio").textContent = "—";
    $(".ring").style.setProperty("--p", 0);
    $("#dealCount").textContent = "0건";
    $("#saleChange").textContent = "—";
    return;
  }
  const avg = key => Math.round(rows.reduce((sum, row) => sum + row[key], 0) / rows.length);
  const sale = avg("sale"), lease = avg("lease"), deals = rows.reduce((sum, row) => sum + row.deals, 0);
  $("#avgSale").textContent = formatPrice(sale);
  $("#avgLease").textContent = formatPrice(lease);
  $("#leaseRatio").textContent = `${(lease / sale * 100).toFixed(1)}%`;
  $(".ring").style.setProperty("--p", Math.round(lease / sale * 100));
  $("#dealCount").textContent = `${deals}건`;
  const changes = rows.filter(row => Number.isFinite(row.change));
  const change = changes.length ? changes.reduce((sum, row) => sum + row.change, 0) / changes.length : null;
  $("#saleChange").textContent = Number.isFinite(change) ? `${change >= 0 ? "+" : ""}${change.toFixed(1)}%` : "—";
}

function rankingValue(c) { const value = state.type === "sale" ? c.sale : state.type === "lease" ? c.lease : c.monthly; return Number.isFinite(value) ? value : -1; }
function rankingPrice(c) { const value = rankingValue(c); return value < 0 ? "실거래 조회" : state.type === "monthly" ? `월 ${c.monthly}만` : formatPrice(value); }
function renderRanking() {
  const rows = [...visibleComplexes()].sort((a, b) => rankingValue(b) - rankingValue(a)).slice(0, 10);
  $("#rankList").innerHTML = rows.map((c, i) => `<button class="rank-row ${c.id === state.selected.id ? "active" : ""}" data-id="${c.id}">
    <span class="rank-no">${String(i + 1).padStart(2, "0")}</span><span class="rank-info"><strong>${c.name}</strong><span>${c.dong} · ${c.year}년 · ${c.households.toLocaleString()}세대</span></span>
    <span class="rank-price"><strong>${rankingPrice(c)}</strong><span class="${Number.isFinite(c.change) && c.change < 0 ? "down" : ""}">${Number.isFinite(c.change) ? `${c.change >= 0 ? "▲" : "▼"} ${Math.abs(c.change).toFixed(1)}%` : "공식 단지목록"}</span></span></button>`).join("");
  $$(".rank-row").forEach(btn => btn.addEventListener("click", () => selectComplex(Number(btn.dataset.id), true)));
  if (!rows.some(c => c.id === state.selected.id)) selectComplex(rows[0].id, false);
}

function mapUrl(c) {
  if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) return "https://www.openstreetmap.org/export/embed.html?bbox=128.64%2C35.75%2C128.90%2C35.97&layer=mapnik";
  const delta = .012;
  const bbox = [c.lng - delta, c.lat - delta * .65, c.lng + delta, c.lat + delta * .65].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${c.lat}%2C${c.lng}`;
}

function selectComplex(id, scroll = false) {
  const selected = complexes.find(c => c.id === id);
  if (!selected) return;
  state.selected = selected;
  $("#mapFrame").src = mapUrl(selected);
  $("#mapName").textContent = selected.name;
  $("#mapAddress").textContent = selected.address;
  $("#mapPrice").textContent = rankingPrice(selected);
  $("#mapMeta").textContent = `${selected.area} · ${state.type === "sale" ? "매매" : state.type === "lease" ? "전세" : "월세"}`;
  $("#analysisName").textContent = selected.name;
  $("#analysisAddress").textContent = selected.address;
  $("#schoolInfo").textContent = selected.school;
  $("#transitInfo").textContent = selected.transit;
  $("#lifeInfo").textContent = selected.life;
  $("#supplyInfo").textContent = selected.supply;
  $("#locationScore").textContent = Number.isFinite(selected.sale) ? Math.min(94, Math.round(79 + selected.sale / 10000 + (selected.change || 0))) : "—";
  $("#analysisNote").textContent = Number.isFinite(selected.change) ? (selected.change >= 2 ? "실거주 선호와 가격 흐름이 함께 받쳐주는 경산 핵심 주거축입니다." : "생활 인프라와 실수요를 중심으로 가격·매물 조건을 함께 비교할 단지입니다.") : "한국부동산원 공식 단지목록에 포함된 경산시 아파트입니다. 가격은 실거래 조회 후 확인해 주세요.";
  renderRanking();
  if (scroll) $("#analysis").scrollIntoView({ behavior: "smooth", block: "center" });
}

function renderListings() {
  $("#listingGrid").innerHTML = state.listings.map((listing, i) => `<article class="listing" data-complex="${listing.complexId}">
    <div class="listing-visual" style="filter:hue-rotate(${i * 13}deg)"><span class="listing-badge ${listing.color || "mint"}">${listing.badge}</span></div>
    <div class="listing-body"><h3>${listing.title}</h3><p class="listing-price">${listing.price}</p><p class="listing-meta">${listing.meta}</p><p class="listing-note">${listing.note}</p></div></article>`).join("");
  $$(".listing").forEach(card => card.addEventListener("click", () => { selectComplex(Number(card.dataset.complex), false); $("#analysis").scrollIntoView({ behavior: "smooth" }); }));
}

function trendPoints() {
  const selected = visibleComplexes().filter(c => Number.isFinite(c.sale) && Number.isFinite(c.lease));
  if (!selected.length) return [];
  const baseSale = selected.reduce((s, c) => s + c.sale, 0) / selected.length;
  const baseLease = selected.reduce((s, c) => s + c.lease, 0) / selected.length;
  return Array.from({ length: state.period === "month" ? 10 : 8 }, (_, i) => ({
    label: state.period === "month" ? `${i + 2}월` : `${i + 1}주`,
    sale: baseSale * (.92 + i * .012 + Math.sin(i * 1.6) * .018),
    lease: baseLease * (.96 + i * .006 + Math.cos(i * 1.2) * .014)
  }));
}

function drawChart() {
  const canvas = $("#trendChart"), ctx = canvas.getContext("2d"), rect = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; ctx.scale(dpr, dpr);
  const w = rect.width, h = rect.height, pad = { l: 48, r: 18, t: 22, b: 35 }, points = trendPoints();
  if (!points.length) { ctx.clearRect(0, 0, w, h); ctx.font = "600 14px Noto Sans KR"; ctx.fillStyle = "#728087"; ctx.textAlign = "center"; ctx.fillText("선택 단지의 실거래 데이터를 조회해 주세요.", w / 2, h / 2); return; }
  const vals = points.flatMap(p => [p.sale, p.lease]), min = Math.min(...vals) * .9, max = Math.max(...vals) * 1.05;
  const x = i => pad.l + (w - pad.l - pad.r) * i / (points.length - 1);
  const y = v => pad.t + (h - pad.t - pad.b) * (1 - (v - min) / (max - min));
  ctx.clearRect(0, 0, w, h); ctx.font = "10px Manrope"; ctx.fillStyle = "#8a989e"; ctx.strokeStyle = "#e7eceb"; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) { const gy = pad.t + (h - pad.t - pad.b) * i / 4; ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(w - pad.r, gy); ctx.stroke(); ctx.fillText(`${Math.round((max - (max-min)*i/4)/1000)/10}억`, 3, gy + 3); }
  points.forEach((p, i) => ctx.fillText(p.label, x(i) - 10, h - 10));
  [["lease", "#365669", 2], ["sale", "#25d7a1", 3]].forEach(([key, color, width]) => { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(x(i), y(p[key])) : ctx.moveTo(x(i), y(p[key]))); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = "round"; ctx.stroke(); points.forEach((p, i) => { ctx.beginPath(); ctx.arc(x(i), y(p[key]), 3, 0, Math.PI*2); ctx.fillStyle = color; ctx.fill(); }); });
  canvas.onmousemove = event => { const r = canvas.getBoundingClientRect(), idx = Math.max(0, Math.min(points.length-1, Math.round((event.clientX-r.left-pad.l)/(w-pad.l-pad.r)*(points.length-1)))), p=points[idx], tip=$("#chartTooltip"); tip.hidden=false; tip.style.left=`${Math.min(w-140,x(idx)+20)}px`; tip.style.top=`${Math.min(y(p.sale),y(p.lease))}px`; tip.innerHTML=`<b>${p.label}</b><br>매매 ${formatPrice(Math.round(p.sale))}<br>전세 ${formatPrice(Math.round(p.lease))}`; };
  canvas.onmouseleave = () => $("#chartTooltip").hidden = true;
}

async function fetchLiveData() {
  const dealYmd = $("#endDate").value.slice(0, 7).replace("-", "");
  const query = new URLSearchParams({ dealYmd, type: state.type, dong: state.dong });
  const live = $(".live-state");
  try {
    const response = await fetch(`/api/trades?${query}`), payload = await response.json();
    state.liveItems = payload.items || [];
    if (payload.mode === "live") { live.classList.remove("sample"); $("#dataState").textContent = `공식 ${complexes.length}개 단지 · 실거래 ${state.liveItems.length}건`; }
    else { live.classList.add("sample"); $("#dataState").textContent = `공식 단지목록 ${complexes.length}개 · 가격 샘플`; }
  } catch { live.classList.add("sample"); $("#dataState").textContent = `공식 단지목록 ${complexes.length}개 · 가격 샘플`; }
}

function bindEvents() {
  $("#dongSelect").addEventListener("change", e => { state.dong=e.target.value; state.apartment="전체"; updateApartmentOptions(); });
  $("#aptSelect").addEventListener("change", e => state.apartment=e.target.value);
  $$(".period-tabs button").forEach(btn => btn.addEventListener("click", () => { $$(".period-tabs button").forEach(b=>b.classList.remove("active")); btn.classList.add("active"); state.period=btn.dataset.period; if(state.period!=="custom") setDates(); drawChart(); }));
  $$(".type-tabs button").forEach(btn => btn.addEventListener("click", async () => { $$(".type-tabs button").forEach(b=>b.classList.remove("active")); btn.classList.add("active"); state.type=btn.dataset.type; renderRanking(); selectComplex(state.selected.id); await fetchLiveData(); }));
  $("#searchBtn").addEventListener("click", async () => { renderKpis(); renderRanking(); drawChart(); await fetchLiveData(); });
  $("#mapExpand").addEventListener("click", () => {
    const url = Number.isFinite(state.selected.lat) && Number.isFinite(state.selected.lng)
      ? `https://www.openstreetmap.org/?mlat=${state.selected.lat}&mlon=${state.selected.lng}#map=16/${state.selected.lat}/${state.selected.lng}`
      : `https://www.openstreetmap.org/search?query=${encodeURIComponent(state.selected.address)}`;
    window.open(url, "_blank", "noopener");
  });
  $("#addListing").addEventListener("click", () => $("#listingDialog").showModal());
  $("#closeDialog").addEventListener("click", () => $("#listingDialog").close());
  $("#listingForm").addEventListener("submit", e => { e.preventDefault(); const added={ id:`U${Date.now()}`, complexId:Number($("#formComplex").value), title:$("#formTitle").value, price:$("#formPrice").value, badge:$("#formBadge").value, meta:$("#formMeta").value, note:$("#formNote").value, color:"mint" }; const custom=JSON.parse(localStorage.getItem("luckyListings")||"[]"); custom.push(added); localStorage.setItem("luckyListings",JSON.stringify(custom)); state.listings.push(added); renderListings(); e.target.reset(); $("#listingDialog").close(); });
  addEventListener("resize", drawChart);
}

async function init() {
  $("#briefDate").textContent = new Intl.DateTimeFormat("sv-SE", { timeZone:"Asia/Seoul", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date()).replaceAll("-", ".");
  initSelects(); setDates(); bindEvents(); renderKpis(); renderListings(); selectComplex(initialComplex.id); drawChart(); await fetchLiveData();
}
init();
