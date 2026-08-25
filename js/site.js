(function () {
  'use strict';

  var CONFIG = window.LMCS_CONFIG = {
    serverAddress: '123.157.211.154:12110',
    qqGroup: '915515421',
    releaseApi: 'https://api.github.com/repos/luozaixuan/mcserverclient/releases/latest',
    fallbackTag: 'v1.7'
  };

  function all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2200);
  }

  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    var copied = false;
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }
    document.body.removeChild(textarea);
    showToast(copied ? '✓ 服务器地址已复制' : '✗ 复制失败，请手动复制');
  }

  function copyServerAddress() {
    var address = document.querySelector('[data-server-address]');
    var text = address ? address.textContent.trim() : CONFIG.serverAddress;
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('✓ 服务器地址已复制');
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  window.copyServerAddress = copyServerAddress;

  function syncConfig() {
    all('[data-server-address]').forEach(function (element) {
      element.textContent = CONFIG.serverAddress;
    });
    all('[data-qq-group]').forEach(function (element) {
      element.textContent = CONFIG.qqGroup;
    });
  }

  function setupCopyButtons() {
    all('[data-copy-server-address]').forEach(function (button) {
      button.addEventListener('click', copyServerAddress);
    });
  }

  function setupNavigation() {
    var navToggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');
    if (!navToggle || !navLinks) return;

    function setOpen(open) {
      navLinks.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    }

    navToggle.addEventListener('click', function () {
      setOpen(!navLinks.classList.contains('is-open'));
    });

    navLinks.addEventListener('click', function (event) {
      var link = event.target.closest ? event.target.closest('a') : null;
      if (link) setOpen(false);
    });

    document.addEventListener('click', function (event) {
      if (window.innerWidth <= 800 && navLinks.classList.contains('is-open') &&
          !navLinks.contains(event.target) && !navToggle.contains(event.target)) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 800) setOpen(false);
    });
  }

  function setupReveal() {
    var items = all('[data-reveal]');
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(function (element) { element.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (element) { observer.observe(element); });
  }

  function setupReleaseLinks() {
    var links = all('.dl-link, .dl-link-mirror');
    var version = document.getElementById('releaseVersion');
    var status = document.getElementById('releaseStatus');
    if (!links.length) return;

    function updateLinks(tag, source) {
      var safeTag = String(tag || '').trim();
      if (!safeTag) return;

      links.forEach(function (link) {
        var base = link.getAttribute('data-base');
        var file = link.getAttribute('data-file');
        if (base && file) {
          link.href = base + encodeURIComponent(safeTag) + '/' + encodeURIComponent(file);
        }
      });

      if (version) version.textContent = safeTag;
      if (status) {
        status.textContent = source === 'api'
          ? '已同步最新版本'
          : source === 'initial'
            ? '链接已就绪，正在检查更新'
            : '在线检查失败，已使用备用版本';
      }
    }

    updateLinks(CONFIG.fallbackTag, 'initial');
    if (!window.fetch) return;

    var controller = window.AbortController ? new AbortController() : null;
    var timeout = window.setTimeout(function () {
      if (controller) controller.abort();
    }, 5000);
    var options = { cache: 'default' };
    if (controller) options.signal = controller.signal;

    window.fetch(CONFIG.releaseApi, options)
      .then(function (response) {
        if (!response.ok) throw new Error('Release API error');
        return response.json();
      })
      .then(function (data) {
        if (!data || !data.tag_name) throw new Error('Missing release tag');
        updateLinks(data.tag_name, 'api');
      })
      .catch(function () {
        updateLinks(CONFIG.fallbackTag, 'fallback');
      })
      .then(function () {
        window.clearTimeout(timeout);
      });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  syncConfig();
  setupCopyButtons();
  setupNavigation();
  setupReveal();
  setupReleaseLinks();
})();
