import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';
import { getSuggestions } from './autocomplete';

interface Props {
  value: string;
  onChange: (value: string) => void;
  source: unknown;
  placeholder?: string;
}

export function JsonPathInput({ value, onChange, source, placeholder }: Props) {
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const ac = useMemo(() => getSuggestions(source, value), [source, value]);
  const open = focused && ac.suggestions.length > 0;

  useEffect(() => {
    setActiveIdx(0);
  }, [value, ac.suggestions.length]);

  // Keep highlighted row visible while scrolling with arrows.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const row = list.children[activeIdx] as HTMLElement | undefined;
    row?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  const apply = (suggestion: string) => {
    const head = value.slice(0, value.length - ac.replaceLen);
    onChange(head + suggestion);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % ac.suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + ac.suggestions.length) % ac.suggestions.length);
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      apply(ac.suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        // Delay blur so clicks on dropdown items register.
        onBlur={() => window.setTimeout(() => setFocused(false), 100)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="font-mono"
        spellCheck={false}
        autoComplete="off"
      />
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-background shadow-lg"
        >
          {ac.suggestions.map((s, i) => (
            <li key={`${s}-${i}`} role="option" aria-selected={i === activeIdx}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  apply(s);
                }}
                onMouseEnter={() => setActiveIdx(i)}
                className={cn(
                  'block w-full cursor-pointer px-2 py-1 text-left font-mono text-xs',
                  i === activeIdx ? 'bg-accent text-foreground' : 'text-muted-foreground',
                )}
              >
                {ac.prefix ? (
                  <>
                    <span className="text-primary">{s.slice(0, ac.prefix.length)}</span>
                    <span>{s.slice(ac.prefix.length)}</span>
                  </>
                ) : (
                  s
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <p className="absolute -bottom-4 right-0 text-[10px] text-muted-foreground">
          Tab / Enter · ↑ ↓ · Esc
        </p>
      )}
    </div>
  );
}
