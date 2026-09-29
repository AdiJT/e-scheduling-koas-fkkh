import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption {
  value: string | number;
  label: string;
  subLabel?: string;
  badge?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  id?: string;
  name?: string;
  value: string | number | null | undefined;
  onChange: (value: any) => void;
  options: (SelectOption | string | number)[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isClearable?: boolean;
  searchable?: boolean;
  accentColor?: 'red' | 'blue' | 'purple' | 'orange' | 'cyan' | 'emerald' | 'indigo';
  maxHeight?: string;
  showSubLabelInTrigger?: boolean;
  minMenuWidth?: number;
}

export default function SearchableSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  searchPlaceholder = 'Ketik untuk mencari...',
  disabled = false,
  required = false,
  error,
  className = '',
  size = 'md',
  isClearable = true,
  searchable = true,
  accentColor = 'indigo',
  maxHeight = 'max-h-60',
  showSubLabelInTrigger = false,
  minMenuWidth = 260,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [menuCoords, setMenuCoords] = useState<{
    top: number;
    left: number;
    width: number;
    openUpward: boolean;
  }>({ top: 0, left: 0, width: 0, openUpward: false });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Normalize options to SelectOption[]
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return opt as SelectOption;
      }
      return {
        value: opt,
        label: String(opt),
      };
    });
  }, [options]);

  // Selected Option
  const selectedOption = useMemo(() => {
    if (value === null || value === undefined || value === '') return null;
    return normalizedOptions.find((opt) => String(opt.value) === String(value)) || null;
  }, [normalizedOptions, value]);

  // Dynamic filter & Smart Sorting based on typed letters
  const filteredAndSortedOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return normalizedOptions;

    // Filter matching options
    const matches = normalizedOptions.filter((opt) => {
      const labelMatch = opt.label.toLowerCase().includes(q);
      const subMatch = opt.subLabel ? opt.subLabel.toLowerCase().includes(q) : false;
      const valMatch = String(opt.value).toLowerCase().includes(q);
      return labelMatch || subMatch || valMatch;
    });

    // Score for smart sorting
    const getScore = (opt: SelectOption) => {
      const label = opt.label.toLowerCase();
      const sub = opt.subLabel ? opt.subLabel.toLowerCase() : '';

      // 1: Exact match
      if (label === q) return 1;
      // 2: Label starts with query (Prefix Match)
      if (label.startsWith(q)) return 2;
      // 3: Any word in label starts with query (e.g. "Bambang" in "Drg. Bambang")
      const words = label.split(/\s+/);
      if (words.some((w) => w.startsWith(q))) return 3;
      // 4: Sub-label starts with query (e.g. NIP: 198...)
      if (sub.startsWith(q) || sub.includes(`: ${q}`) || sub.includes(`:${q}`)) return 4;
      // 5: Label contains query
      if (label.includes(q)) return 5;
      // 6: Sub-label contains query
      if (sub.includes(q)) return 6;
      return 7;
    };

    return matches.sort((a, b) => {
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      if (scoreA !== scoreB) return scoreA - scoreB;
      return a.label.localeCompare(b.label, 'id-ID');
    });
  }, [normalizedOptions, search]);

  // Accent color themes
  const theme = useMemo(() => {
    switch (accentColor) {
      case 'red':
        return {
          borderFocus: 'focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20',
          itemActive: 'bg-red-50 text-red-900 font-semibold',
          highlight: 'bg-red-100/70',
          badge: 'bg-red-100 text-red-800 border-red-200',
        };
      case 'blue':
        return {
          borderFocus: 'focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20',
          itemActive: 'bg-blue-50 text-blue-900 font-semibold',
          highlight: 'bg-blue-100/70',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'purple':
        return {
          borderFocus: 'focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20',
          itemActive: 'bg-purple-50 text-purple-900 font-semibold',
          highlight: 'bg-purple-100/70',
          badge: 'bg-purple-100 text-purple-800 border-purple-200',
        };
      case 'orange':
        return {
          borderFocus: 'focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20',
          itemActive: 'bg-orange-50 text-orange-900 font-semibold',
          highlight: 'bg-orange-100/70',
          badge: 'bg-orange-100 text-orange-800 border-orange-200',
        };
      case 'cyan':
        return {
          borderFocus: 'focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20',
          itemActive: 'bg-cyan-50 text-cyan-900 font-semibold',
          highlight: 'bg-cyan-100/70',
          badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        };
      case 'emerald':
        return {
          borderFocus: 'focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20',
          itemActive: 'bg-emerald-50 text-emerald-900 font-semibold',
          highlight: 'bg-emerald-100/70',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case 'indigo':
      default:
        return {
          borderFocus: 'focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20',
          itemActive: 'bg-indigo-50 text-indigo-900 font-semibold',
          highlight: 'bg-indigo-100/70',
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        };
    }
  }, [accentColor]);

  // Size styling
  const sizeStyles = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          trigger: 'px-3 py-1.5 text-xs rounded-lg min-h-[34px]',
          input: 'text-xs py-1.5',
          item: 'px-3 py-1.5 text-xs',
          icon: 'w-3.5 h-3.5',
        };
      case 'lg':
        return {
          trigger: 'px-4 py-3.5 text-base rounded-xl min-h-[52px]',
          input: 'text-sm py-2.5',
          item: 'px-4 py-2.5 text-sm',
          icon: 'w-4 h-4',
        };
      case 'md':
      default:
        return {
          trigger: 'px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm rounded-xl min-h-[46px]',
          input: 'text-xs sm:text-sm py-2',
          item: 'px-3.5 py-2.5 text-xs sm:text-sm',
          icon: 'w-4 h-4',
        };
    }
  }, [size]);

  // Calculate coordinates for portal dropdown menu
  const updateCoords = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = 270;
    const upward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    const width = Math.max(rect.width, minMenuWidth);
    let left = rect.left;
    if (left + width > window.innerWidth - 16) {
      left = Math.max(16, rect.right - width);
    }

    setMenuCoords({
      top: upward ? rect.top - 6 : rect.bottom + 6,
      left,
      width,
      openUpward: upward,
    });
  }, [minMenuWidth]);

  // Handle open/close
  const toggleDropdown = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
      setIsOpen(true);
      setSearch('');
      setHighlightedIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setIsOpen(false);
    }
  };

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearch('');
    setHighlightedIndex(-1);
  }, []);

  // Update coords on resize/scroll while open
  useEffect(() => {
    if (!isOpen) return;
    updateCoords();

    const handleUpdate = () => {
      updateCoords();
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isOpen, updateCoords]);

  // Handle outside click (checks both container trigger and portaled menu)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        closeDropdown();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeDropdown]);

  // Select item
  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    closeDropdown();
  };

  // Clear value
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        toggleDropdown();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev < filteredAndSortedOptions.length - 1 ? prev + 1 : 0;
          scrollIntoView(next);
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : filteredAndSortedOptions.length - 1;
          scrollIntoView(next);
          return next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredAndSortedOptions.length) {
          handleSelect(filteredAndSortedOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        break;
      case 'Tab':
        closeDropdown();
        break;
    }
  };

  const scrollIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('.select-item');
    if (items[index]) {
      (items[index] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left select-none ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for form validation compatibility */}
      {(required || name) && (
        <input
          type="text"
          name={name}
          tabIndex={-1}
          autoComplete="off"
          value={value !== null && value !== undefined ? String(value) : ''}
          onChange={() => {}}
          required={required}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
        />
      )}

      {/* Trigger Button */}
      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        onClick={toggleDropdown}
        className={`w-full flex items-center justify-between gap-2 border-2 transition-all cursor-pointer outline-none
          ${sizeStyles.trigger}
          ${disabled ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60' : 'bg-slate-50 hover:bg-white text-slate-800'}
          ${error ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}
          ${isOpen ? `${theme.borderFocus} bg-white shadow-sm` : ''}
        `}
      >
        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
          {selectedOption ? (
            <div className="min-w-0 flex-1 flex items-center gap-1.5 overflow-hidden">
              <span className="font-semibold text-slate-900 truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border shrink-0 ${theme.badge}`}>
                  {selectedOption.badge}
                </span>
              )}
              {showSubLabelInTrigger && selectedOption.subLabel && (
                <span className="text-[11px] text-slate-500 font-medium truncate shrink-0">
                  ({selectedOption.subLabel})
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 font-normal truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400 ml-1">
          {isClearable && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Hapus pilihan"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <svg
            className={`${sizeStyles.icon} transition-transform duration-200 ${isOpen ? 'rotate-180 text-slate-700' : 'text-slate-400'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Portaled Dropdown Menu to prevent overflow-hidden clipping */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={`fixed z-[9999] bg-white border border-slate-200 rounded-2xl shadow-elevated p-1.5 transition-all animate-scale-in`}
            style={{
              ...(menuCoords.openUpward
                ? { bottom: `${window.innerHeight - menuCoords.top + 6}px` }
                : { top: `${menuCoords.top}px` }),
              left: `${menuCoords.left}px`,
              width: `${menuCoords.width}px`,
              maxWidth: 'calc(100vw - 32px)',
              transformOrigin: menuCoords.openUpward ? 'bottom' : 'top',
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Live Search Input with Smart Sorting */}
            {searchable && (
              <div className="p-1 mb-1 border-b border-slate-100">
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-slate-400">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                    </svg>
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    placeholder={searchPlaceholder}
                    className={`w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 focus:bg-white transition-all`}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        inputRef.current?.focus();
                      }}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div ref={listRef} className={`overflow-y-auto ${maxHeight} divide-y divide-slate-50 space-y-0.5 custom-scrollbar`}>
              {filteredAndSortedOptions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  <p className="font-semibold text-slate-600 mb-0.5">Tidak ditemukan</p>
                  <p className="text-[11px]">Tidak ada pilihan yang cocok dengan &quot;{search}&quot;</p>
                </div>
              ) : (
                filteredAndSortedOptions.map((option, idx) => {
                  const isSelected = selectedOption?.value === option.value;
                  const isHighlighted = highlightedIndex === idx;

                  return (
                    <div
                      key={`${option.value}-${idx}`}
                      onClick={() => handleSelect(option)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`select-item w-full flex items-center justify-between gap-2.5 rounded-xl cursor-pointer transition-colors
                        ${sizeStyles.item}
                        ${option.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
                        ${isSelected ? theme.itemActive : isHighlighted ? 'bg-slate-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50'}
                      `}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`block truncate ${isSelected ? 'font-bold' : 'font-medium'}`}>
                            {option.label}
                          </span>
                          {option.badge && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${theme.badge}`}>
                              {option.badge}
                            </span>
                          )}
                        </div>
                        {option.subLabel && (
                          <p className={`text-[11px] mt-0.5 leading-relaxed ${isSelected ? 'text-indigo-700/80 font-medium' : 'text-slate-400'}`}>
                            {option.subLabel}
                          </p>
                        )}
                      </div>

                      {isSelected && (
                        <span className="text-emerald-600 font-bold shrink-0 ml-1">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
