
(async () => {
  const VERSION = 'v11.2-grok-strict';
  if (window.__AI_NAV_INSTANCE__ === VERSION) return;
  window.__AI_NAV_INSTANCE__ = VERSION;

  const HEADER_OFFSET = 85;
  const SCROLL_DURATION_MS = 520;

  const CSS_STYLE = `
    :host { all: initial; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }
    .navigator-root {
      position: fixed; right: 0; top: 0; bottom: 0;
      z-index: 2147483647; display: flex; flex-direction: column;
      align-items: flex-end; justify-content: center; pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .hot-zone {
      position: absolute; right: 0; top: 200px; bottom: 200px; width: 48px;
      pointer-events: auto;
    }
    .nav-panel {
      pointer-events: auto; margin-right: 12px; display: flex; flex-direction: column;
      align-items: flex-end; transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
      border-radius: 24px; background: transparent; padding: 12px 6px; width: 8px;
      max-height: 85vh; overflow: hidden;
    }
    .navigator-root:not(.open) .nav-panel {
      width: 28px; padding: 8px 0;
    }
    .navigator-root.open .nav-panel {
      width: 350px; padding: 24px 18px; background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(35px) saturate(180%); border: 1px solid rgba(0,0,0,0.06);
      box-shadow: -15px 0 60px rgba(0,0,0,0.12);
    }
    .nav-list {
      display: flex; flex-direction: column; gap: 6px; width: 100%;
      max-height: 460px; overflow-y: auto; scroll-behavior: smooth; scrollbar-width: none;
    }
    .nav-list::-webkit-scrollbar { display: none; }
    .nav-item {
      display: flex; align-items: center; justify-content: flex-end;
      min-height: 44px; width: 100%; cursor: pointer; gap: 14px;
      border-radius: 14px; transition: all 0.2s ease; padding: 0 10px;
    }
    .nav-item:hover { background: rgba(77, 107, 254, 0.08); }
    .nav-text {
      flex: 1; font-size: 13.5px; color: #444; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; text-align: left;
      opacity: 0; transform: translateX(18px); transition: all 0.35s cubic-bezier(0.2, 0, 0, 1);
    }
    .navigator-root.open .nav-text { opacity: 1; transform: translateX(0); }
    .nav-item.active .nav-text { color: #4D6BFE; font-weight: 700; }
    .nav-dash {
      width: 16px; height: 2.5px; background: rgba(0,0,0,0.18);
      border-radius: 999px; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); flex-shrink: 0;
    }
    .nav-item.active .nav-dash {
      width: 22px; height: 4px; background: #4D6BFE;
      box-shadow: 0 0 12px rgba(77, 107, 254, 0.55);
    }
    .nav-footer { margin-top: 24px; margin-right: 14px; display: flex; flex-direction: column; align-items: center; line-height: 1; opacity: 0; transition: opacity 0.3s; }
    .navigator-root.open .nav-footer { opacity: 1; }
    .nav-footer .active-num { color: #4D6BFE; font-weight: 900; font-size: 22px; }
    .nav-footer .divider { color: #ddd; font-size: 14px; margin: -2px 0; transform: scaleY(0.5); }
    .nav-footer .total-num { color: #999; font-size: 13px; font-weight: 600; }
    @media (prefers-color-scheme: dark) {
      .navigator-root.open .nav-panel { background: rgba(30, 30, 32, 0.98); border-color: rgba(255,255,255,0.08); }
      .nav-text { color: #bbb; } .nav-dash { background: rgba(255,255,255,0.22); }
    }
  `;

  const PLATFORMS = [
    { name: 'ChatGPT', host: 'chatgpt.com', selector: 'article[data-turn="user"]', textSelector: '.whitespace-pre-wrap', scroll: 'main' },
    { 
      name: 'Claude', 
      host: 'claude.ai', 
      selector: '[data-testid="user-message"]', 
      // 新版 Claude 主区 main + conversation-pane，旧版仍是 .overflow-y-auto，择优取第一个可滚动的
      scroll: '[data-testid="conversation-pane"], [data-testid*="scrollable"], main, .overflow-y-auto, [class*="overflow-y-auto"], [class*="scroll-container"], [class*="ScrollContainer"]' 
    },
    { name: 'Gemini', host: 'gemini.google.com', selector: 'user-query, [data-test-id="user-query"]', scroll: '.chat-history' },
    { name: 'DeepSeek', host: 'deepseek.com', selector: '.ds-markdown--user', scroll: 'main' },
    { 
      name: 'Doubao', 
      host: 'doubao.com', 
      selector: '[data-testid="union_message"]:has([data-testid="send_message"])', 
      textSelector: '[data-testid="message_text_content"]', 
      // Doubao 新版常见滚动容器：message-list / scroll_view / scroll-view
      scroll: '[data-testid=\"message-list\"], [data-testid=\"scroll_view\"], .simplebar-content-wrapper, .simplebar-content, [class*=\"scroll-view\"], [class*=\"scrollable\"], [class*=\"scroll-content\"], [class*=\"chat-scroll\"], main, body' 
    },
    { name: 'Grok', host: 'grok.com', selector: 'div[id^="response-"].items-end', textSelector: '.response-content-markdown', scroll: 'main' },
    { name: 'Yuanbao', host: 'yuanbao.tencent.com', selector: '.agent-chat__list__item--human', textSelector: '.hyc-content-text', scroll: '.agent-chat__list' }
  ];

  const config = PLATFORMS.find(p => window.location.hostname.includes(p.host));
  if (!config) return;

  const host = document.createElement('div');
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const root = document.createElement('div');
  root.className = 'navigator-root';
  const style = document.createElement('style');
  style.textContent = CSS_STYLE;
  shadow.appendChild(style);
  shadow.appendChild(root);

  let nodes = [], activeIndex = -1, isManualLock = false, lockTimer = null, io = null;

  const updateUI = (idx, force = false) => {
    if (idx < 0) return;
    if (!force && idx === activeIndex) return;
    activeIndex = idx;
    root.querySelectorAll('.nav-item').forEach((item, i) => item.classList.toggle('active', i === activeIndex));
    const footer = shadow.querySelector('.nav-footer');
    if (footer) footer.innerHTML = `<div class="active-num">${activeIndex + 1}</div><div class="divider">/</div><div class="total-num">${nodes.length}</div>`;
    const list = shadow.querySelector('.nav-list');
    const activeItem = shadow.querySelector(`.nav-item[data-index="${activeIndex}"]`);
    if (list && activeItem) activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const scan = () => {
    const allElements = Array.from(document.querySelectorAll(config.selector));
    const elements = allElements.filter((el, i, arr) => !arr.some((other, j) => i !== j && other.contains(el)));

    const shouldSkipNode = (el) => {
      if (!el) return false;
      const tag = el.tagName;
      if (['BUTTON', 'SVG', 'SCRIPT', 'STYLE', 'IMG', 'PICTURE', 'CANVAS', 'VIDEO', 'AUDIO'].includes(tag)) return true;
      return Boolean(el.closest('[data-testid*="attachment"], [data-testid*="file"], [data-testid*="upload"], [data-testid*="image"], [class*="attachment"], [class*="file"], [class*="upload"], [class*="image"], [aria-label*="attachment"], [aria-label*="file"], [aria-label*="image"], [aria-label*="图片"], [aria-label*="附件"]'));
    };

    const stripAttachmentNames = (text) => text
      .split(/\s+/)
      .filter(part => part &&
        !/\.(png|jpe?g|gif|webp|svg|bmp|heic|heif|pdf|docx?|pptx?|xlsx?|zip|rar|7z|ts|tsx|js|jsx|json|txt|md|log)$/i.test(part) &&
        !/^(?:image\d*|图片)$/i.test(part) &&
        !/^(?:ts|tsx|js|jsx|json|md|txt|pdf|doc|docx|ppt|pptx|xls|xlsx|zip|rar|7z)$/i.test(part)
      )
      .join(' ');

    const newNodes = elements.map((el, i) => {
      const textEl = config.textSelector ? el.querySelector(config.textSelector) : null;

      // 深度遍历文本节点，跳过附件/图片容器
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      const textParts = [];
      let current;
      while (current = walker.nextNode()) {
        const parent = current.parentElement;
        if (shouldSkipNode(parent)) continue;
        const t = current.textContent && current.textContent.trim();
        if (t) textParts.push(t);
      }

      let raw = textParts.join(' ').trim();
      if (!raw && textEl) raw = (textEl.textContent || textEl.innerText || '').trim();
      if (!raw) raw = (el.innerText || '').trim();

      let cleanText = stripAttachmentNames(raw)
        .replace(/^(?:你说|你写道|你发的|User|You|Me)(?:\s+(?:said|说|写道|发的))?[：:\-\s]*/i, '')
        .replace(/^said[：:\-\s]*/i, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return null;

      return { el, text: cleanText.slice(0, 42) };
    }).filter(Boolean);

    if (newNodes.length !== nodes.length || (nodes.length > 0 && newNodes[newNodes.length-1].text !== nodes[nodes.length-1].text)) {
      nodes = newNodes;
      render();
      if (io) io.disconnect();
      io = new IntersectionObserver((entries) => {
        if (isManualLock) return;
        const visible = entries.filter(e => e.isIntersecting).sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const foundIdx = nodes.findIndex(n => n.el === visible[0].target);
          if (foundIdx !== -1) updateUI(foundIdx);
        }
      }, { rootMargin: `-${HEADER_OFFSET}px 0px -70% 0px`, threshold: [0, 0.01] });
      nodes.forEach(n => io.observe(n.el));
    }
  };

  const render = () => {
    if (nodes.length === 0) { root.style.opacity = '0'; return; }
    root.style.opacity = '1';
    root.style.pointerEvents = 'none';

    root.innerHTML = `
      <div class="hot-zone" aria-hidden="true"></div>
      <div class="nav-panel">
        <div class="nav-list">
          ${nodes.map((n, i) => `<div class="nav-item" data-index="${i}" title="${n.text}"><div class="nav-text">${n.text}</div><div class="nav-dash"></div></div>`).join('')}
        </div>
        <div class="nav-footer"></div>
      </div>
    `;
    const hotZone = root.querySelector('.hot-zone');
    const navPanel = root.querySelector('.nav-panel');
    const open = () => root.classList.add('open');
    const close = (e) => { if (!root.contains(e.relatedTarget)) root.classList.remove('open'); };
    hotZone.addEventListener('mouseenter', open);
    hotZone.addEventListener('mouseleave', close);
    navPanel.addEventListener('mouseenter', open);
    navPanel.addEventListener('mouseleave', close);

    const getScrollTop = (container) => {
      if (container === window) {
        return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      }
      return container.scrollTop;
    };

    const getMaxScrollTop = (container) => {
      if (container === window) {
        const doc = document.documentElement;
        return Math.max(0, doc.scrollHeight - window.innerHeight);
      }
      return Math.max(0, container.scrollHeight - container.clientHeight);
    };

    const setScrollTop = (container, value) => {
      if (container === window) {
        window.scrollTo(0, value);
      } else {
        container.scrollTop = value;
      }
    };

    const easeInOutCubic = (t) => (
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    );

    const smoothScrollTo = (container, target) => {
      const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setScrollTop(container, target);
        return;
      }
      const start = getScrollTop(container);
      const change = target - start;
      if (Math.abs(change) < 1) {
        setScrollTop(container, target);
        return;
      }
      let startTime = null;
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const t = Math.min(elapsed / SCROLL_DURATION_MS, 1);
        const eased = easeInOutCubic(t);
        setScrollTop(container, start + change * eased);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const isDoubao = config && config.name === 'Doubao';

    const isKnownDoubaoScrollContainer = (el) => {
      if (!el) return false;
      const testid = (el.getAttribute && el.getAttribute('data-testid')) || '';
      const cls = (el.className || '').toString();
      if (testid.toLowerCase() === 'scroll_view' || testid.toLowerCase() === 'message-list') return true;
      return cls.includes('scroll-view');
    };

    const isScrollable = (el) => {
      if (!el || el === window) return true;
      // Doubao 有些滚动容器 overflowY 不是 auto/scroll，仍需识别为滚动根
      if (isDoubao && isKnownDoubaoScrollContainer(el)) return true;
      const canScroll = el.scrollHeight - el.clientHeight > 1;
      if (!canScroll) return false;
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      const allowsScroll = ['auto', 'scroll', 'overlay'].includes(overflowY);
      if (allowsScroll) return true;
      return false;
    };

    const isReverseScrollContainer = (el) => {
      if (!el || el === window) return false;
      const style = window.getComputedStyle(el);
      const flexDir = (style.flexDirection || '').toLowerCase();
      if (flexDir.includes('reverse')) return true;
      const cls = (el.className || '').toString().toLowerCase();
      return cls.includes('reverse');
    };

    const getScrollContainer = (el) => {
      if (!el) return window;
      let parent = el.parentElement;
      while (parent && parent !== document.body && parent !== document.documentElement) {
        if (isScrollable(parent)) return parent;
        parent = parent.parentElement;
      }
      return window;
    };

    const isNavigationLike = (el) => {
      if (!el) return false;
      const tag = el.tagName;
      if (['NAV', 'ASIDE'].includes(tag)) return true;
      const role = el.getAttribute('role');
      if (role && role.toLowerCase().includes('navigation')) return true;
      const aria = (el.getAttribute('aria-label') || '').toLowerCase();
      if (aria.includes('sidebar') || aria.includes('nav')) return true;
      const testid = (el.getAttribute('data-testid') || '').toLowerCase();
      if (testid.includes('sidebar') || testid.includes('nav')) return true;
      return false;
    };

    const isInsideNavigation = (el) => {
      let p = el;
      while (p && p !== document.body) {
        if (isNavigationLike(p)) return true;
        p = p.parentElement;
      }
      return false;
    };

    const findPreferredScroll = (target) => {
      if (!config.scroll) return null;
      const selectors = config.scroll.split(',').map(s => s.trim()).filter(Boolean);
      for (const sel of selectors) {
        const candidates = Array.from(document.querySelectorAll(sel))
          .filter(isScrollable)
          .filter(c => !isInsideNavigation(c));

        // 1) 优先选择既可滚动又包含目标节点的容器
        const containing = candidates.find(c => c.contains(target));
        if (containing) return containing;

        if (isDoubao) continue;

        // 2) 选择与目标区域有水平重叠且非导航侧栏的容器
        const targetRect = target.getBoundingClientRect();
        const overlapping = candidates.find(c => {
          const rect = c.getBoundingClientRect();
          const horizontalOverlap = rect.right > targetRect.left && rect.left < targetRect.right;
          return horizontalOverlap && !isNavigationLike(c);
        });
        if (overlapping) return overlapping;

        // 3) 退而求其次：第一个非导航、可滚动的候选
        const nonNav = candidates.find(c => !isNavigationLike(c));
        if (nonNav) return nonNav;

        // 4) 最后兜底：任意可滚动候选
        if (candidates.length > 0) return candidates[0];
      }
      return null;
    };

    root.querySelectorAll('.nav-item').forEach(item => {
      item.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(item.dataset.index);
        isManualLock = true; 
        updateUI(idx);
        if (lockTimer) clearTimeout(lockTimer);
        lockTimer = setTimeout(() => { isManualLock = false; }, 1500);
        const headerOffset = isDoubao ? 0 : HEADER_OFFSET;

        const scrollToNodeIn = (container) => {
          const nodeRect = nodes[idx].el.getBoundingClientRect();
          const containerTop = container === window ? 0 : container.getBoundingClientRect().top;
          const current = getScrollTop(container);
          const delta = nodeRect.top - containerTop;
          const shouldReverse = isDoubao && isReverseScrollContainer(container);
          const rawTarget = shouldReverse ? (current - delta - headerOffset) : (current + delta - headerOffset);
          const target = Math.min(Math.max(0, rawTarget), getMaxScrollTop(container));
          smoothScrollTo(container, target);
          return target;
        };

        if (isDoubao) {
          const preferred = findPreferredScroll(nodes[idx].el);
          const container = preferred
            || getScrollContainer(nodes[idx].el)
            || document.querySelector('[data-testid="message-list"]')
            || document.querySelector('[data-testid="scroll_view"]')
            || window;

          const start = getScrollTop(container);
          nodes[idx].el.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
          const end = getScrollTop(container);

          if (end !== start) {
            setScrollTop(container, start);
            smoothScrollTo(container, end);
          } else {
            const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const behavior = prefersReducedMotion ? 'auto' : 'smooth';
            nodes[idx].el.scrollIntoView({ behavior, block: 'start', inline: 'nearest' });
          }
          return;
        }

        const preferred = findPreferredScroll(nodes[idx].el);
        const sc = preferred || getScrollContainer(nodes[idx].el);
        scrollToNodeIn(sc);
      };
    });
    updateUI(activeIndex, true);
  };

  window.addEventListener('scrollend', () => { isManualLock = false; scan(); });
  window.addEventListener('scroll', () => { if(!isManualLock) scan(); }, {passive: true});
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  scan();
})();
