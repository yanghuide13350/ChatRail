
import { PlatformConfig } from './types';

export const PLATFORMS: PlatformConfig[] = [
  {
    name: 'ChatGPT',
    hostname: 'chatgpt.com',
    userMessageSelector: 'article[data-turn="user"]',
    scrollContainerSelector: 'main, [class*="react-scroll-to-bottom"], .overflow-y-auto',
    textSelector: '.whitespace-pre-wrap, [data-message-author-role="user"]',
  },
  {
    name: 'Claude',
    hostname: 'claude.ai',
    userMessageSelector: '[data-testid="user-message"]',
    scrollContainerSelector: '.overflow-y-auto, main',
    textSelector: '.font-user-message, [data-testid="user-message"]',
  },
  {
    name: 'Gemini',
    hostname: 'gemini.google.com',
    userMessageSelector: 'user-query, [data-test-id="user-query"]',
    scrollContainerSelector: '.chat-history, infinite-scroller, [class*="chat-history"]',
    textSelector: '.query-text, .user-query-content',
  },
  {
    name: 'DeepSeek',
    hostname: 'deepseek.com',
    userMessageSelector: '.ds-markdown--user',
    scrollContainerSelector: '.ds-chat-main-container, main',
    textSelector: '.ds-markdown--user',
  },
  {
    name: 'Doubao',
    hostname: 'doubao.com',
    // 严格过滤：只选择包含“发送者标识(send_message)”的 union_message 容器，彻底剔除 AI 回复
    userMessageSelector: '[data-testid="union_message"]:has([data-testid="send_message"])',
    scrollContainerSelector: '[class*="chat-scroll-view"], [class*="simplebar-content-wrapper"], .scroll-view',
    textSelector: '[data-testid="message_text_content"]',
  },
  {
    name: 'Grok',
    hostname: 'grok.com',
    // 精确锁定：用户消息在 Grok 中带有 items-end 类（靠右），AI 消息则是 items-start（靠左）
    userMessageSelector: 'div[id^="response-"].items-end',
    scrollContainerSelector: 'main, [class*="MessageList"], [class*="scroll-container"]',
    textSelector: '.response-content-markdown, [dir="auto"]',
  },
  {
    name: 'Yuanbao',
    hostname: 'yuanbao.tencent.com',
    userMessageSelector: '.agent-chat__list__item--human, .agent-chat__bubble--human',
    scrollContainerSelector: '.agent-chat__list, [class*="message-list"], .chat-container',
    textSelector: '.hyc-content-text, .agent-chat__bubble__content',
  }
];

export const NAV_WIDTH = 48;
export const DASH_HEIGHT = 2.5;
export const DASH_GAP = 6;
