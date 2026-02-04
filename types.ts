
export interface ChatNode {
  id: string;
  index: number;
  text: string;
  element: HTMLElement;
  isActive: boolean;
}

export interface PlatformConfig {
  name: string;
  hostname: string;
  userMessageSelector: string;
  scrollContainerSelector: string;
  textSelector: string;
}

export interface AppState {
  nodes: ChatNode[];
  activeIndex: number;
  platform: PlatformConfig | null;
}
