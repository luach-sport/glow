/* The packs store: sentence and picture packs on Glow's site (packs/index.json). Install, update, remove.
   With "automatic updates" on, installed packs update by themselves and new packs marked as automatic come in,
   whenever there is internet (at most twice a day). Everything installed works offline. */
(function () {
  'use strict';
  const GL = window.GL;
  const ST = (GL.store = { busy: '', progress: 0, error: '' });
  const listeners = [];
  GL.onStore = (cb) => listeners.push(cb);
  const notify = () => listeners.forEach((cb) => { try { cb(); } catch (e) { console.warn(e); } });
  const S = () => GL.state;
  const safeId = (s) => String(s || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 40);

  async function getJson(url) {
    const r = await GL.http(url + (url.indexOf('?') < 0 ? '?t=' : '&t=') + Date.now(), { timeout: 20000, as: 'text' });
    if (!r.ok) throw new Error('http ' + r.status);
    return typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
  }

  ST.installed = (id) => S().packs.find((p) => p.id === id) || null;
  ST.list = () => ((S().store.index && S().store.index.packs) || []).filter((p) => p && p.id && (p.kind === 'quotes' || p.kind === 'images'));
  ST.hasUpdate = (p) => { const i = ST.installed(p.id); return !!i && (+p.version || 1) > i.version; };

  ST.refresh = async (manual) => {
    if (!GL.online()) { if (manual) GL.toast('אין חיבור לאינטרנט'); return false; }
    ST.busy = 'list'; ST.error = ''; notify();
    try {
      const idx = await getJson(GL.STORE_URL + 'index.json');
      if (!idx || !Array.isArray(idx.packs)) throw new Error('bad index');
      S().store.index = { packs: idx.packs.slice(0, 200), updated: idx.updated || '' };
      S().store.lastCheck = Date.now();
      GL.save();
      return true;
    } catch (e) {
      ST.error = 'לא הצלחתי לטעון את החנות כרגע';
      if (manual) GL.toast(ST.error);
      return false;
    } finally { ST.busy = ''; notify(); }
  };

  ST.install = async (id, quiet) => {
    const info = ST.list().find((p) => p.id === id);
    if (!info || ST.busy) return false;
    if (!GL.online()) { if (!quiet) GL.toast('אין חיבור לאינטרנט'); return false; }
    const pid = safeId(id);
    ST.busy = id; ST.progress = 0; ST.error = ''; notify();
    try {
      const base = GL.STORE_URL + pid + '/';
      const doc = await getJson(base + 'pack.json');
      let items;
      if (info.kind === 'quotes') {
        items = (doc.items || []).filter((q) => q && q.id && q.t).map((q) => ({ id: pid + ':' + String(q.id).slice(0, 40), t: String(q.t).slice(0, 300) }));
      } else {
        items = [];
        const src = (doc.items || []).filter((q) => q && q.id && q.file).slice(0, 200);
        for (let i = 0; i < src.length; i++) {
          const q = src[i], iid = pid + ':' + safeId(q.id);
          const file = 'glow/packs/' + pid + '/' + safeId(q.id) + '.jpg', thumb = 'glow/packs/' + pid + '/t-' + safeId(q.id) + '.jpg';
          await GL.downloadTo(base + q.file, file);
          if (q.thumb) { try { await GL.downloadTo(base + q.thumb, thumb); } catch (e) { /* the big one is enough */ } }
          items.push({ id: iid, name: String(q.name || '').slice(0, 80), file, thumb: q.thumb ? thumb : '', parts: Array.isArray(q.parts) ? q.parts : [] });
          ST.progress = Math.round(((i + 1) / src.length) * 100); notify();
        }
      }
      if (!items.length) throw new Error('empty pack');
      const pack = { id: pid, name: String(info.name || doc.name || pid).slice(0, 60), kind: info.kind, version: +info.version || 1, desc: String(info.desc || '').slice(0, 200), installedAt: Date.now(), items };
      S().packs = S().packs.filter((p) => p.id !== pid).concat([pack]);
      S().store.removed = S().store.removed.filter((x) => x !== pid);
      GL.save();
      if (!quiet) GL.toast(info.kind === 'quotes' ? 'נוספו ' + items.length + ' משפטים' : 'נוספו ' + items.length + ' תמונות');
      return true;
    } catch (e) {
      console.warn('pack', id, e && e.message);
      ST.error = 'ההורדה לא הושלמה. אפשר לנסות שוב.';
      if (!quiet) GL.toast(ST.error);
      return false;
    } finally { ST.busy = ''; ST.progress = 0; notify(); }
  };

  ST.remove = async (id) => {
    const p = ST.installed(id);
    if (!p) return;
    if (p.kind === 'images') await GL.deleteDir('glow/packs/' + p.id);
    S().packs = S().packs.filter((x) => x.id !== id);
    p.items.forEach((i) => { delete S().imgMeta[i.id]; delete S().qMeta[i.id]; });
    ['both', 'home', 'lock'].forEach((k) => { const r = S().rot[k]; if (r.album === 'pack:' + id) r.album = 'all'; if (r.quoteSet === 'pack:' + id) r.quoteSet = 'all'; });
    if (!S().store.removed.includes(id)) S().store.removed.push(id);
    GL.save();
    GL.toast('החבילה הוסרה');
    notify();
  };

  // In the background: keep installed packs fresh and bring in new automatic ones.
  ST.auto = async () => {
    if (!S().store.autoUpdate || !GL.online() || ST.busy) return;
    if (Date.now() - S().store.lastCheck < 12 * 3600e3 && S().store.index) return;
    if (!(await ST.refresh(false))) return;
    let n = 0;
    for (const p of ST.list()) {
      const due = ST.hasUpdate(p) || (p.auto && !ST.installed(p.id) && !S().store.removed.includes(p.id));
      if (due && (await ST.install(p.id, true))) n++;
    }
    if (n) { GL.toast('Glow התעדכן: נוספו משפטים ותמונות חדשים'); GL.rerenderAll(); }
  };
})();
