
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * 插件注入逻辑
 * 创建一个宿主元素并附加 Shadow DOM，确保插件样式不受原网页影响
 */
const initExtension = () => {
  const hostId = 'chatrail-host';
  if (document.getElementById(hostId)) return;

  const host = document.createElement('div');
  host.id = hostId;
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647'; // 确保在最顶层
  host.style.top = '0';
  host.style.right = '0';
  host.style.pointerEvents = 'none';
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });
  
  // 注入 Tailwind 和 自定义样式
  const tailwindCdn = document.createElement('script');
  tailwindCdn.src = 'https://cdn.tailwindcss.com';
  
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    :host {
      all: initial; /* 重置所有继承样式 */
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .navigator-container {
      pointer-events: auto;
    }
    /* 解决 Shadow DOM 中 Tailwind 的一些局限性 */
    @keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
    .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
  `;
  
  const rootContainer = document.createElement('div');
  rootContainer.className = 'navigator-container';
  
  shadowRoot.appendChild(tailwindCdn);
  shadowRoot.appendChild(styleTag);
  shadowRoot.appendChild(rootContainer);

  const root = ReactDOM.createRoot(rootContainer);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// 延迟启动以确保 DOM 加载
if (document.readyState === 'complete') {
  initExtension();
} else {
  window.addEventListener('load', initExtension);
}
