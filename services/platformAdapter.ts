
import { PLATFORMS } from '../constants';
import { ChatNode, PlatformConfig } from '../types';

export const getCurrentPlatform = (): PlatformConfig | null => {
  const hostname = window.location.hostname;
  return PLATFORMS.find(p => hostname.includes(p.hostname)) || null;
};

export const scanNodes = (config: PlatformConfig): ChatNode[] => {
  const elements = Array.from(document.querySelectorAll(config.userMessageSelector));
  
  const uniqueElements = elements.filter((el, idx) => {
    return !elements.some((other, oIdx) => idx !== oIdx && other.contains(el));
  });

  return uniqueElements.map((el, index) => {
    const textEl = config.textSelector ? el.querySelector(config.textSelector) : null;
    let fullText = '';

    if (textEl && textEl.textContent?.trim()) {
      fullText = textEl.textContent;
    } else {
      // 豆包专项修复：如果指定选择器没拿到内容，深度遍历获取所有纯文本，避开按钮和图标
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      let textParts: string[] = [];
      let currentNode;
      while (currentNode = walker.nextNode()) {
        const parent = currentNode.parentElement;
        if (parent && !['BUTTON', 'SVG', 'SCRIPT', 'STYLE'].includes(parent.tagName)) {
          const t = currentNode.textContent?.trim();
          if (t) textParts.push(t);
        }
      }
      fullText = textParts.join(' ');
    }
    
    // 清洗逻辑
    const cleanText = fullText.trim()
      .replace(/^(你说|You|User|Me)[:：\s]*/i, '')
      .replace(/\s+/g, ' ');

    return {
      id: `node-${index}-${el.id || 'no-id'}`,
      index,
      text: cleanText.slice(0, 45) || `对话节点 ${index + 1}`,
      element: el as HTMLElement,
      isActive: false
    };
  });
};
