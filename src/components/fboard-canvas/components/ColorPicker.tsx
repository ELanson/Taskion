import React, { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const SWATCHES = [
  '#000000', '#ffffff', '#ef4444', '#f97316', 
  '#eab308', '#22c55e', '#3b82f6', '#a855f7'
];

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          type="button"
          className="w-10 h-10 rounded-md border border-neutral-200 shadow-sm cursor-pointer shrink-0"
          style={{ backgroundColor: color }}
          onClick={() => setIsOpen(!isOpen)}
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all uppercase text-sm w-full text-neutral-900 font-medium"
        />
      </div>
      
      {isOpen && (
        <div 
          ref={popoverRef}
          className="absolute z-50 top-full left-0 mt-2 p-3 bg-white rounded-xl shadow-xl border border-neutral-200"
        >
          <HexColorPicker color={color} onChange={onChange} />
          <div className="flex gap-2 mt-3 flex-wrap w-[200px]">
            {SWATCHES.map(swatch => (
              <button
                key={swatch}
                type="button"
                className="w-6 h-6 rounded-md border border-neutral-200 shadow-sm hover:scale-110 transition-transform"
                style={{ backgroundColor: swatch }}
                onClick={() => onChange(swatch)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
