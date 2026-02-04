
import React, { useState } from 'react';
import { ChatNode } from '../types';

interface NavigatorItemProps {
  node: ChatNode;
  isActive: boolean;
  onClick: () => void;
}

const NavigatorItem: React.FC<NavigatorItemProps> = ({ node, isActive, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative flex items-center justify-end h-9 w-full cursor-pointer group/item px-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* 摘要文字：随容器展开或悬浮显示 */}
      <div 
        className={`flex-1 text-left text-[13px] mr-3 truncate transition-all duration-300 ${
          isActive ? 'text-blue-500 font-medium' : 'text-neutral-500'
        } ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}
      >
        {node.text}
      </div>

      {/* 导航横杠 */}
      <div 
        className={`transition-all duration-300 rounded-full flex-shrink-0 ${
          isActive 
            ? 'w-5 h-[3.5px] bg-blue-500 shadow-[0_0_12px_rgba(77,107,246,0.6)]' 
            : 'w-3 h-[2px] bg-neutral-400 opacity-40 group-hover/item:bg-neutral-300 group-hover/item:w-4 group-hover/item:opacity-80'
        }`}
      />
    </div>
  );
};

export default NavigatorItem;