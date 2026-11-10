const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));
const signed = (value, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  return `${n > 0 ? '+' : ''}${n.toFixed(digits)}%`;
};
const trend = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'flat';
  return Number(value) > 0 ? 'up' : Number(value) < 0 ? 'down' : 'flat';
};

function tile(item) {
  const delta = item.deltaText || signed(item.change);
  const deltaClass = item.deltaText ? 'flat' : trend(item.change);
  return `
    <article class="tile ${item.cls}">
      <div class="tile-head"><span>${esc(item.group)}</span><span>${esc(item.date || '')}</span></div>
      <div class="tile-label">${esc(item.label)}</div>
      <div class="tile-main"><b>${esc(item.value)}</b><span class="${deltaClass}">${esc(delta)}</span></div>
      ${item.sub ? `<div class="tile-sub"><div>${esc(item.sub)}</div></div>` : ''}
    </article>`;
}

function renderMarket(data) {
  const m = data.market;
  const a = m.a || [];
  const us = m.us || [];
  const hk = m.hk || [];
  const gold = m.gold || {};
  const fx = m.fx || {};
  const yields = m.yields || [];
  const metrics = [
    ...a.map((x) => ({ cls: 'a', group: 'A股', label: x.label, value: x.value, change: x.change })),
    ...hk.map((x) => ({ cls: 'hk', group: '港股', label: x.label, value: x.value, change: x.change })),
    ...us.map((x) => ({ cls: 'us', group: '美股', label: x.label, value: x.value, change: x.change })),
    { cls: 'gold', group: '黄金', label: gold.label || 'COMEX黄金', value: gold.value || '—', change: gold.change, sub: `${gold.rmb || ''}${gold.date ? ' · ' + gold.date : ''}`, date: gold.date || '' },
    { cls: 'fx', group: '汇率', label: fx.label || 'USD/CNY', value: fx.value || '—', change: fx.change, sub: `中间价${fx.date ? ' · ' + fx.date : ''}`, date: fx.date || '' },
  ];
  $('market-grid').innerHTML = metrics.map(tile).join('');

  const aText = a.map((x) => `${x.label} ${signed(x.change)}`).join('，');
  const usText = us.map((x) => `${x.label} ${signed(x.change)}`).join('，');
  const bondText = yields.map((x) => `${x.label} ${x.value}`).join('，');
  $('read-grid').innerHTML = `
    <article class="read"><span>A股</span><b>成长和中小盘更强</b><p>${esc(aText)}。风险偏好回暖，但别把一天当趋势。</p></article>
    <article class="read"><span>美股</span><b>隔夜大涨，等 CPI</b><p>${esc(usText)}。今晚美国 10 月 CPI 是下一个变量，影响利率、汇率和黄金。</p></article>
    <article class="read"><span>债市</span><b>利率仍在低位</b><p>${esc(bondText)}。纯债看久期和信用，不要把“纯债”理解成“保本”。</p></article>`;
}

function renderProducts(data) {
  $('products').innerHTML = (data.products || []).map((p) => `
    <article class="product ${p.id === 'yixin' ? 'yixin' : 'jiajun'}">
      <div class="product-top">
        <div><h3>${esc(p.short)}</h3><div class="codes">${esc(p.codes)}</div></div>
        <span class="label">${esc(p.label)}</span>
      </div>
      <div class="product-facts">${(p.facts || []).filter(([k]) => ['类型', '股票仓位', '基金经理'].includes(k)).map(([k, v]) => `${esc(k)} ${esc(v)}`).join(' · ')}</div>
      <div class="one-line">${esc(p.oneLine)}</div>
      <div class="product-script"><span>对客可以这样说</span>${esc(p.script || '')}</div>
      <div class="fit-grid">
        <div class="fit-box"><span>适合谁</span><div class="chips">${(p.fit || []).map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div></div>
        <div class="fit-box"><span>不适合谁</span><div class="chips">${(p.notFit || []).map((x) => `<span class="chip no">${esc(x)}</span>`).join('')}</div></div>
      </div>
      <div class="when"><b>什么时候可以提：</b>${esc(p.when)}</div>
      <div class="risk">${esc(p.risk)}</div>
    </article>`).join('');
}

function renderTalkTracks(data) {
  $('talk').innerHTML = (data.talkTracks || []).map((item, index) => `
    <article class="talk">
      <div class="talk-num">0${index + 1}</div>
      <div>
        <h3>${esc(item.client)}</h3>
        <p class="say"><b>可以这样说：</b>${esc(item.say)}</p>
        <p class="avoid"><b>不要这样说：</b>${esc(item.avoid)}</p>
      </div>
    </article>`).join('');
}

function renderPosition(data) {
  const m = data.market || {};
  const series = m.series || [];
  const stats = m.stats || [];
  const valuation = m.valuation || [];
  const fundamentals = m.fundamentals || [];
  const scenarios = m.scenarios || [];

  if (series.length) {
    const W = 720;
    const H = 260;
    const pad = { l: 34, r: 14, t: 14, b: 24 };
    const values = series.flatMap((s) => s.points.map((p) => p.value));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const x = (i, n) => pad.l + (W - pad.l - pad.r) * (n <= 1 ? 0 : i / (n - 1));
    const y = (v) => H - pad.b - (H - pad.t - pad.b) * (v - min) / span;
    const grid = [0, 1, 2, 3].map((i) => {
      const gy = pad.t + (H - pad.t - pad.b) * i / 3;
      const value = max - span * i / 3;
      return `<line x1="${pad.l}" y1="${gy}" x2="${W - pad.r}" y2="${gy}" stroke="#ddd0be" stroke-width="1" stroke-dasharray="3 4"/><text x="4" y="${gy + 3}" fill="#7a6f62" font-size="9">${value.toFixed(0)}</text>`;
    }).join('');
    const lines = series.map((s) => {
      const pts = s.points.map((p, i) => `${x(i, s.points.length).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
      return `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity=".92"/>`;
    }).join('');
    const first = series[0]?.points?.[0]?.date || '';
    const last = series[0]?.points?.[series[0].points.length - 1]?.date || '';
    $('market-chart').innerHTML = `${grid}${lines}
      <text x="${pad.l}" y="${H - 6}" fill="#7a6f62" font-size="9">${esc(first)}</text>
      <text x="${W - pad.r}" y="${H - 6}" fill="#7a6f62" font-size="9" text-anchor="end">${esc(last)}</text>`;
    $('chart-legend').innerHTML = series.map((s) => {
      const lastValue = s.points[s.points.length - 1]?.value;
      return `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${esc(s.label)} <b>${lastValue?.toFixed(1) ?? '—'}</b></span>`;
    }).join('');
  }

  $('index-stats').innerHTML = stats.map((s) => `
    <div class="stat-card">
      <span>${esc(s.label)} · 近 1 年</span>
      <b class="${trend(s.return_1y)}">${signed(s.return_1y)}</b>
      <small>距 1 年高点 ${signed(s.from_high)} · 最大回撤 ${signed(s.mdd_1y)}</small>
    </div>`).join('');

  const y10 = (m.yields || []).find((x) => x.label.includes('10Y')) || {};
  const lpr = m.lpr || {};
  const shibor = m.shibor || {};
  $('position-grid').innerHTML = `
    <article class="position-card">
      <h3>资金面</h3>
      <ul>
        <li><span>10Y 国债</span><b>${esc(y10.value || '—')}</b></li>
        <li><span>LPR 1Y / 5Y</span><b>${esc(lpr['1y'] ?? '—')}% / ${esc(lpr['5y'] ?? '—')}%</b></li>
        <li><span>Shibor 隔夜</span><b>${esc(shibor.value ?? '—')}%</b></li>
      </ul>
    </article>
    <article class="position-card">
      <h3>估值</h3>
      <ul>${valuation.map((x) => `<li><span>${esc(x.label)}</span><b>${esc(x.value)} <small>${esc(x.date)}</small></b></li>`).join('')}</ul>
    </article>
    <article class="position-card">
      <h3>基本面</h3>
      <ul>${fundamentals.map((x) => `<li><span>${esc(x.label)}</span><b>${esc(x.value)} <small>${esc(x.date)}</small></b></li>`).join('')}</ul>
    </article>`;

  const pe300 = valuation.find((x) => x.label.includes('沪深300'))?.value || '—';
  const peStar = valuation.find((x) => x.label.includes('科创50'))?.value || '—';
  const pmiM = fundamentals.find((x) => x.label.includes('制造业'))?.value || '—';
  const pmiS = fundamentals.find((x) => x.label.includes('非制造业'))?.value || '—';
  $('viewpoint').innerHTML = `
    <article class="viewpoint-card"><span>估值</span><b>沪深300 PE ${esc(pe300)}</b><p>科创50 PE ${esc(peStar)}，科技估值偏高；不同指数不可直接比。</p></article>
    <article class="viewpoint-card"><span>资金</span><b>10Y ${esc(y10.value || '—')}</b><p>LPR ${esc(lpr['1y'] ?? '—')}% / ${esc(lpr['5y'] ?? '—')}%，资金面偏宽松，但继续大幅下行空间有限。</p></article>
    <article class="viewpoint-card"><span>基本面</span><b>PMI ${esc(pmiM)} / ${esc(pmiS)}</b><p>仍在荣枯线下，盈利验证需要时间，政策仍有发力必要。</p></article>
    <article class="viewpoint-card"><span>一句话</span><b>震荡市，结构行情</b><p>科技不追高、分批；纯债做底仓。不是预测点位，是准备预案。</p></article>`;

  $('scenario-grid').innerHTML = scenarios.map((s) => `
    <article class="scenario ${esc(s.tone || 'flat')}">
      <h3>${esc(s.name)}</h3>
      <p><b>触发：</b>${esc(s.trigger)}</p>
      <p><b>动作：</b>${esc(s.action)}</p>
    </article>`).join('');
}

function renderManagers(data) {
  $('managers').innerHTML = (data.products || []).map((p) => `
    <article class="manager">
      <b>${esc(p.facts?.find((x) => x[0] === '基金经理')?.[1] || '')}</b><span>${esc(p.short)}</span>
      <p>${esc(p.managerNote)}</p>
    </article>`).join('');
}

function renderQA(data) {
  $('qa').innerHTML = (data.clientQuestions || []).map((item) => `
    <article class="qa"><h3>${esc(item.q)}</h3><p>${esc(item.a)}</p></article>`).join('');
}

function renderEvents(data) {
  $('events').innerHTML = (data.events || []).map((e) => `
    <div class="event">
      <div class="event-date">${esc(e.date)}<span>${esc(e.time || '—')}</span></div>
      <div><h3>${esc(e.title)}</h3><p>${esc(e.why)}</p></div>
    </div>`).join('');
}

function init() {
  const data = window.PORTAL_DATA;
  if (!data) return;
  $('summary').textContent = data.market.summary;
  $('updated').textContent = data.meta.updated_at;
  $('data-date').textContent = data.meta.data_date;
  $('disclaimer').textContent = data.meta.disclaimer;
  renderMarket(data);
  renderPosition(data);
  renderProducts(data);
  renderTalkTracks(data);
  renderManagers(data);
  renderQA(data);
  renderEvents(data);
}

init();
