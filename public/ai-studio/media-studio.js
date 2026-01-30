/**
 * AI创作工坊 - 主壳：左侧垂直功能栏 + 右侧内容区（独立模块 v2.0.0）
 */
(function () {
  const STORAGE_KEY_BASE = 'media_studio_yunwu_api_base';
  const STORAGE_KEY_APIKEY = 'media_studio_yunwu_api_key';
  const STORAGE_KEY_WORKS = 'media_studio_works';
  const WORKS_API_KEY = 'media_studio_works';

  function syncWorksToServer() {
    try {
      var list = window.MediaStudio.getWorks();
      fetch('/api/works/' + encodeURIComponent(WORKS_API_KEY), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list: list })
      }).catch(function () {});
    } catch (e) {}
  }

  window.MediaStudio = {
    features: {},
    currentId: null,

    register: function (id, spec) {
      if (!id || !spec || !spec.name || typeof spec.getPanel !== 'function') return;
      this.features[id] = Object.assign({ id }, spec);
    },

    getYunwuApiBase: function () {
      try { return localStorage.getItem(STORAGE_KEY_BASE) || ''; } catch (e) { return ''; }
    },
    getYunwuApiKey: function () {
      try { return localStorage.getItem(STORAGE_KEY_APIKEY) || ''; } catch (e) { return ''; }
    },
    setYunwuConfig: function (base, apiKey) {
      try {
        if (base != null) localStorage.setItem(STORAGE_KEY_BASE, String(base).trim());
        if (apiKey != null) localStorage.setItem(STORAGE_KEY_APIKEY, String(apiKey));
      } catch (e) {}
    },
    isLocalhost: function () {
      try {
        var origin = window.location.origin || '';
        return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(origin);
      } catch (e) { return false; }
    },
    isLocalhostUrl: function (url) {
      if (!url || typeof url !== 'string') return false;
      return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(url);
    },
    chooseUrlOrBase64: function (url, base64, hasDeployUrl) {
      hasDeployUrl = hasDeployUrl || false;
      if (!url && !base64) return '';
      var isLocal = this.isLocalhostUrl(url);
      if (isLocal && !hasDeployUrl && base64) {
        return { type: 'base64', value: base64 };
      }
      if (url && (!isLocal || hasDeployUrl)) {
        return { type: 'url', value: url };
      }
      if (base64) {
        return { type: 'base64', value: base64 };
      }
      if (url) {
        return { type: 'url', value: url };
      }
      return '';
    },
    getWorks: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY_WORKS);
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    },
    addWork: function (item) {
      var list = this.getWorks();
      item.id = item.id || 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      item.createdAt = item.createdAt || new Date().toISOString();
      list.unshift(item);
      try {
        localStorage.setItem(STORAGE_KEY_WORKS, JSON.stringify(list.slice(0, 500)));
        syncWorksToServer();
      } catch (e) {}
      return item.id;
    },
    updateWork: function (workId, updates) {
      var list = this.getWorks();
      var i = list.findIndex(function (w) { return w.id === workId; });
      if (i < 0) return;
      var w = list[i];
      Object.keys(updates || {}).forEach(function (k) { w[k] = updates[k]; });
      list[i] = w;
      try {
        localStorage.setItem(STORAGE_KEY_WORKS, JSON.stringify(list.slice(0, 500)));
        syncWorksToServer();
      } catch (e) {}
    },
    syncWorksToServer: syncWorksToServer
  };

  var featureOrder = ['settings', 'text2img', 'img2video', 'lipsync', 'dubbing', 'editimg', 'works'];

  function renderSidebar() {
    var nav = document.getElementById('studioNav');
    if (!nav) return;
    var html = '';
    featureOrder.forEach(function (id) {
      var f = window.MediaStudio.features[id];
      if (!f) return;
      var cls = 'studio-nav-item' + (id === 'settings' ? ' settings-item' : '');
      var tag = (id === 'settings' || id === 'works') ? '' : '<span class="studio-nav-tag">NEW</span>';
      html += '<a class="' + cls + '" href="#' + id + '" data-id="' + id + '">' +
        '<span class="studio-nav-icon">' + (f.icon || '📌') + '</span>' +
        '<span class="studio-nav-text">' + f.name + '</span>' + tag + '</a>';
    });
    nav.innerHTML = html;

    nav.querySelectorAll('.studio-nav-item').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var id = el.getAttribute('data-id');
        if (id) switchFeature(id);
      });
    });
  }

  function switchFeature(id) {
    var f = window.MediaStudio.features[id];
    if (!f) return;
    window.MediaStudio.currentId = id;
    document.querySelectorAll('.studio-nav-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-id') === id);
    });
    var container = document.getElementById('featureContent');
    if (!container) return;
    var inner = container.querySelector('.studio-content-inner');
    if (!inner) {
      inner = document.createElement('div');
      inner.className = 'studio-content-inner';
      container.appendChild(inner);
    }
    inner.innerHTML = typeof f.getPanel === 'function' ? f.getPanel() : '';
    if (typeof f.init === 'function') f.init(inner);
    if (window.location.hash !== '#' + id) {
      try { window.history.replaceState(null, '', '#' + id); } catch (e) {}
    }
  }

  function getInitialId() {
    var hash = (window.location.hash || '').replace(/^#/, '');
    if (hash && window.MediaStudio.features[hash]) return hash;
    return featureOrder[0];
  }

  function boot() {
    // 从服务端拉取作品列表（持久化在项目目录，换电脑复制项目可保留）
    try {
      fetch('/api/works/' + encodeURIComponent(WORKS_API_KEY))
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.success && Array.isArray(d.list) && d.list.length > 0) {
            localStorage.setItem(STORAGE_KEY_WORKS, JSON.stringify(d.list));
          }
        })
        .catch(function () {});
    } catch (e) {}
    renderSidebar();
    var id = getInitialId();
    switchFeature(id);
    window.addEventListener('hashchange', function () {
      var id2 = (window.location.hash || '').replace(/^#/, '');
      if (id2 && window.MediaStudio.features[id2]) switchFeature(id2);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    setTimeout(boot, 0);
  }
})();
