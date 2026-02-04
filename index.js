
(async () => {
  const VERSION = 'v11.2-grok-strict';
  if (window.__AI_NAV_INSTANCE__ === VERSION) return;
  window.__AI_NAV_INSTANCE__ = VERSION;

  const HEADER_OFFSET = 85;

  const CSS_STYLE = `
    :host { all: initial; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }
    .navigator-root {
      position: fixed; right: 0; top: 0; bottom: 0; width: 50px;
      z-index: 2147483647; display: flex; flex-direction: column;
      align-items: flex-end; justify-content: center; pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .nav-panel {
      pointer-events: auto; margin-right: 12px; display: flex; flex-direction: column;
      align-items: flex-end; transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
      border-radius: 24px; background: transparent; padding: 12px 6px; width: 28px;
      max-height: 85vh; overflow: hidden;
    }
    .navigator-root:hover .nav-panel {
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
    .navigator-root:hover .nav-text { opacity: 1; transform: translateX(0); }
    .nav-item.active .nav-text { color: #4D6BFE; font-weight: 700; }
    .nav-dash {
      width: 14px; height: 2.5px; background: rgba(0,0,0,0.15);
      border-radius: 2px; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); flex-shrink: 0;
    }
    .nav-item.active .nav-dash {
      width: 26px; height: 4.5px; background: #4D6BFE;
      box-shadow: 0 0 15px rgba(77, 107, 254, 0.6);
    }
    .nav-footer { margin-top: 24px; margin-right: 14px; display: flex; flex-direction: column; align-items: center; line-height: 1; opacity: 0; transition: opacity 0.3s; }
    .navigator-root:hover .nav-footer { opacity: 1; }
    .nav-footer .active-num { color: #4D6BFE; font-weight: 900; font-size: 22px; }
    .nav-footer .divider { color: #ddd; font-size: 14px; margin: -2px 0; transform: scaleY(0.5); }
    .nav-footer .total-num { color: #999; font-size: 13px; font-weight: 600; }
    @media (prefers-color-scheme: dark) {
      .navigator-root:hover .nav-panel { background: rgba(30, 30, 32, 0.98); border-color: rgba(255,255,255,0.08); }
      .nav-text { color: #bbb; } .nav-dash { background: rgba(255,255,255,0.22); }
    }
  `;

  const PLATFORMS = [
    { name: 'ChatGPT', host: 'chatgpt.com', selector: 'article[data-turn="user"]', textSelector: '.whitespace-pre-wrap', scroll: 'main' },
    { name: 'Claude', host: 'claude.ai', selector: '[data-testid="user-message"]', scroll: '.overflow-y-auto' },
    { name: 'Gemini', host: 'gemini.google.com', selector: 'user-query, [data-test-id="user-query"]', scroll: '.chat-history' },
    { name: 'DeepSeek', host: 'deepseek.com', selector: '.ds-markdown--user', scroll: 'main' },
    { name: 'Doubao', host: 'doubao.com', selector: '[data-testid="union_message"]:has([data-testid="send_message"])', textSelector: '[data-testid="message_text_content"]', scroll: '.simplebar-content-wrapper' },
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

  const updateUI = (idx) => {
    if (idx === activeIndex || idx < 0) return;
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
    
    const newNodes = elements.map((el, i) => {
      const textEl = config.textSelector ? el.querySelector(config.textSelector) : null;
      let raw = (textEl ? textEl.innerText : el.innerText).trim();
      
      // 增强文本获取 fallback
      if (!raw) {
        raw = Array.from(el.childNodes)
          .filter(n => n.nodeType === 3)
          .map(n => n.textContent).join(' ').trim();
      }

      const cleanText = raw.replace(/^(你说|You|User|Me)[:：\s]*/i, '').replace(/\n/g, ' ');
      return { el, text: cleanText.slice(0, 42) || `节点 ${i + 1}` };
    });

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
    root.style.pointerEvents = 'auto';

    root.innerHTML = `
      <div class="nav-panel">
        <div class="nav-list">
          ${nodes.map((n, i) => `<div class="nav-item" data-index="${i}" title="${n.text}"><div class="nav-text">${n.text}</div><div class="nav-dash"></div></div>`).join('')}
        </div>
        <div class="nav-footer"></div>
      </div>
    `;
    root.querySelectorAll('.nav-item').forEach(item => {
      item.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(item.dataset.index);
        isManualLock = true; 
        updateUI(idx);
        if (lockTimer) clearTimeout(lockTimer);
        lockTimer = setTimeout(() => { isManualLock = false; }, 1500);
        nodes[idx].el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          const sc = document.querySelector(config.scroll) || window;
          (sc === window ? window : sc).scrollBy(0, -HEADER_OFFSET);
        }, 500);
      };
    });
    updateUI(activeIndex);
  };

  window.addEventListener('scrollend', () => { isManualLock = false; scan(); });
  window.addEventListener('scroll', () => { if(!isManualLock) scan(); }, {passive: true});
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  scan();
})();
