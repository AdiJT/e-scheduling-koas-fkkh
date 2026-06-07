import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ content, children, position = 'bottom' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      let top = 0;
      let left = 0;

      if (position === 'top') {
        top = rect.top + scrollY - 6;
        left = rect.left + scrollX + rect.width / 2;
      } else if (position === 'bottom') {
        top = rect.bottom + scrollY + 6;
        left = rect.left + scrollX + rect.width / 2;
      } else if (position === 'left') {
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - 6;
      } else if (position === 'right') {
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + 6;
      }

      setCoords({ top, left });
    }
  };

  useEffect(() => {
    if (visible) {
      updateCoords();
      // Track scroll on any element in case inside a scrollable container
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [visible]);

  const translateClass = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent',
  };

  return (
    <div
      ref={triggerRef}
      className="inline-flex items-center justify-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible &&
        createPortal(
          <div
            className={`fixed z-[9999] pointer-events-none ${translateClass[position]}`}
            style={{ top: coords.top, left: coords.left }}
          >
            <div className="bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-800/50 whitespace-nowrap relative animate-scale-in">
              {content}
              <div className={`absolute border-4 ${arrowClasses[position]}`} />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
