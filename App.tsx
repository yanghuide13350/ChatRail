
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatNode, PlatformConfig } from './types';
import { getCurrentPlatform, scanNodes } from './services/platformAdapter';
import NavigatorItem from './components/NavigatorItem';

const HEADER_OFFSET = 85;

const App: React.FC = () => {
  const [nodes, setNodes] = useState<ChatNode[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [platform, setPlatform] = useState<PlatformConfig | null>(null);
  
  const observerRef = useRef<MutationObserver | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const isManualScrolling = useRef(false);
  const scrollLockTimer = useRef<number | null>(null);

  const performScan = useCallback((config: PlatformConfig) => {
    const rawNodes = scanNodes(config);
    setNodes(prev => {
      if (prev.length !== rawNodes.length) return rawNodes;
      if (prev.length > 0 && rawNodes.length > 0 && prev[prev.length - 1].text !== rawNodes[rawNodes.length - 1].text) {
        return rawNodes;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const config = getCurrentPlatform();
    setPlatform(config);

    if (config) {
      performScan(config);
      observerRef.current = new MutationObserver(() => performScan(config));
      observerRef.current.observe(document.body, { childList: true, subtree: true });
    }

    return () => observerRef.current?.disconnect();
  }, [performScan]);

  useEffect(() => {
    if (intersectionObserverRef.current) intersectionObserverRef.current.disconnect();

    intersectionObserverRef.current = new IntersectionObserver((entries) => {
      if (isManualScrolling.current) return;

      const intersecting = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (intersecting.length > 0) {
        const index = nodes.findIndex(n => n.element === intersecting[0].target);
        if (index !== -1) setActiveIndex(index);
      }
    }, {
      rootMargin: `-${HEADER_OFFSET}px 0px -70% 0px`,
      threshold: [0, 0.01]
    });

    nodes.forEach(node => intersectionObserverRef.current?.observe(node.element));

    return () => intersectionObserverRef.current?.disconnect();
  }, [nodes]);

  const scrollToNode = (node: ChatNode, index: number) => {
    if (!platform) return;

    isManualScrolling.current = true;
    setActiveIndex(index);

    if (scrollLockTimer.current) clearTimeout(scrollLockTimer.current);

    node.element.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(() => {
      const sc = document.querySelector(platform.scrollContainerSelector) || window;
      (sc === window ? window : sc).scrollBy(0, -HEADER_OFFSET);
    }, 500);

    scrollLockTimer.current = window.setTimeout(() => {
      isManualScrolling.current = false;
    }, 1200);
  };

  useEffect(() => {
    const handleScrollEnd = () => {
      if (isManualScrolling.current) {
        if (scrollLockTimer.current) clearTimeout(scrollLockTimer.current);
        isManualScrolling.current = false;
      }
    };
    window.addEventListener('scrollend', handleScrollEnd);
    return () => window.removeEventListener('scrollend', handleScrollEnd);
  }, []);

  if (nodes.length === 0) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-12 flex flex-col items-end justify-center z-[2147483647] group">
      <div className="mr-2 flex flex-col items-end transition-all duration-500 ease-[cubic-bezier(0.18,0.89,0.32,1.28)] bg-transparent p-2 rounded-[24px] hover:w-[320px] hover:bg-white/95 hover:backdrop-blur-3xl hover:shadow-2xl hover:border hover:border-black/5 dark:hover:bg-neutral-900/95 dark:hover:border-white/10">
        <div className="w-full max-h-[440px] overflow-y-auto overflow-x-hidden scrollbar-hide space-y-1 pr-1">
          {nodes.map((node, i) => (
            <NavigatorItem
              key={node.id}
              node={node}
              isActive={activeIndex === i}
              onClick={() => scrollToNode(node, i)}
            />
          ))}
        </div>
        <div className="mt-5 mr-2 flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity">
          <span className="text-[20px] font-black text-blue-500 leading-none">{activeIndex + 1}</span>
          <span className="text-[14px] text-neutral-300 dark:text-neutral-700 my-[-2px] scale-y-50">/</span>
          <span className="text-[12px] text-neutral-400 font-bold">{nodes.length}</span>
        </div>
      </div>
    </div>
  );
};

export default App;
