
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

  const shouldSkipNode = (el: HTMLElement | null) => {
    if (!el) return false;
    const tag = el.tagName;
    if (['BUTTON', 'SVG', 'SCRIPT', 'STYLE', 'IMG', 'PICTURE', 'CANVAS', 'VIDEO', 'AUDIO'].includes(tag)) return true;
    return Boolean(el.closest('[data-testid*="attachment"], [data-testid*="file"], [data-testid*="upload"], [data-testid*="image"], [class*="attachment"], [class*="file"], [class*="upload"], [class*="image"], [aria-label*="attachment"], [aria-label*="file"], [aria-label*="image"], [aria-label*="图片"], [aria-label*="附件"]'));
  };

  const stripAttachmentNames = (text: string) => text
    .split(/\s+/)
    .filter(part => part && !/\.((png|jpe?g|gif|webp|svg|bmp|heic|heif|pdf|docx?|pptx?|xlsx?|zip|rar|7z|ts|tsx|js|jsx|json|txt|md|log))$/i.test(part)
      && !/^image\d*$/i.test(part)
      && !/^图片$/i.test(part))
    .join(' ');

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
        const parent = (currentNode as Text).parentElement;
        if (shouldSkipNode(parent)) continue;
        const t = currentNode.textContent?.trim();
        if (t) textParts.push(t);
      }
      fullText = textParts.join(' ');
    }
    
    // 清洗逻辑：去掉“you said”等前缀，过滤附件/图片文件名
    let cleanText = stripAttachmentNames(fullText.trim())
      .replace(/^(?:你说|你写道|你发的|User|You|Me)(?:\s+(?:said|说|写道|发的))?[：:\-\s]*/i, '')
      .replace(/^said[：:\-\s]*/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return null;

    return {
      id: `node-${index}-${el.id || 'no-id'}`,
      index,
      text: cleanText.slice(0, 45),
      element: el as HTMLElement,
      isActive: false
    };
  }).filter(Boolean) as ChatNode[];
};
