/* 产品页市场速览：复用 data/portal.js 数据，渲染 9 个指标 + 一句话速览 + 三条读法 */
(function () {
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
        <div class="tile-label">${esc(item.label)}</div>
        <div class="tile-main"><b>${esc(item.value)}</b><span class="${deltaClass}">${esc(delta)}</span></div>
        ${item.sub ? `<div class="tile-sub"><div>${esc(item.sub)}</div></div>` : ''}
      </article>`;
  }

  function init() {
    const data = window.PORTAL_DATA;
    if (!data || !data.market) return;
    const m = data.market;
    const a = m.a || [];
    const hk = m.hk || [];
    const us = m.us || [];
    const gold = m.gold || {};
    const fx = m.fx || {};
    const yields = m.yields || [];

    const metrics = [
      ...a.map((x) => ({ cls: 'a', label: x.label, value: x.value, change: x.change })),
      ...hk.map((x) => ({ cls: 'hk', label: '恒生', value: x.value, change: x.change })),
      ...us.map((x) => ({ cls: 'us', label: x.label === '标普500' ? '标普' : x.label, value: x.value, change: x.change })),
      { cls: 'gold', label: 'COMEX黄金', value: gold.value || '—', change: gold.change, sub: `${gold.rmb || ''}${gold.date ? ' · ' + gold.date : ''}` },
      { cls: 'fx', label: 'USD/CNY', value: fx.value || '—', change: fx.change, sub: `中间价${fx.date ? ' · ' + fx.date : ''}` },
    ];
    const grid = $('pm-market-grid');
    if (grid) grid.innerHTML = metrics.map(tile).join('');

    const summary = $('pm-summary');
    if (summary) summary.textContent = m.summary || '—';
    const updated = $('pm-updated');
    if (updated) updated.textContent = (data.meta && data.meta.updated_at) || '—';
    const date = $('pm-date');
    if (date) date.textContent = (data.meta && data.meta.data_date) || '—';

    const avg = (arr) => arr.length ? arr.reduce((sum, x) => sum + Number(x.change || 0), 0) / arr.length : 0;
    const aAvg = avg(a);
    const usAvg = avg(us);
    const aTitle = aAvg > 0.5 ? '成长更强' : aAvg > -0.5 ? '分化' : '偏弱';
    const usTitle = usAvg > 1 ? '隔夜大涨' : usAvg > 0 ? '隔夜偏强' : usAvg > -1 ? '隔夜回落' : '隔夜走弱';

    const aText = a.map((x) => `${x.label} ${signed(x.change)}`).join('，');
    const usText = us.map((x) => `${x.label} ${signed(x.change)}`).join('，');
    const bondText = yields.map((x) => `${x.label} ${x.value}`).join('，');

    const readGrid = $('pm-read-grid');
    if (readGrid) {
      readGrid.innerHTML = `
        <article class="read"><span>A股</span><b>${aTitle}</b><p>${esc(aText)}。看结构，不看一天；别把反弹当反转。</p></article>
        <article class="read"><span>美股</span><b>${usTitle}</b><p>${esc(usText)}。外部风险偏好影响开盘情绪，但别把一天当趋势。</p></article>
        <article class="read"><span>债市</span><b>利率仍在低位</b><p>${esc(bondText)}。纯债看久期和信用，不要把“纯债”理解成“保本”。</p></article>`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
