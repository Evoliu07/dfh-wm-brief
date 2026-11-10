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
  renderProducts(data);
  renderTalkTracks(data);
  renderManagers(data);
  renderQA(data);
  renderEvents(data);
}

init();
