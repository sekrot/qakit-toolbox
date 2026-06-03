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
  /** -1 = nothing highlighted yet. First ArrowDown brings it to 0. */
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const ac = useMemo(() => getSuggestions(source, value), [source, value]);
  // Hide the dropdown when the only remaining option matches exactly what the
  // user has already typed — there's nothing to insert and the popup is just
  // visual noise.
  const onlyExactMatch =
    ac.suggestions.length === 1 && normaliseToken(ac.suggestions[0]) === normaliseToken(ac.prefix);
  const open = focused && ac.suggestions.length > 0 && !onlyExactMatch;

  // Reset highlight when the suggestion list changes (new typing, new path).
  useEffect(() => {
    setActiveIdx(-1);
  }, [value, ac.suggestions.length]);

  // Keep highlighted row visible while scrolling with arrows.
  useEffect(() => {
    if (!open || activeIdx < 0) return;
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
    const n = ac.suggestions.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // -1 → 0 → 1 → ... → n-1 → 0
      setActiveIdx((i) => (i < 0 ? 0 : (i + 1) % n));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // -1 → n-1, otherwise wrap backwards
      setActiveIdx((i) => (i <= 0 ? n - 1 : i - 1));
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      // If user hasn't moved the highlight yet, apply the first suggestion.
      const idx = activeIdx < 0 ? 0 : activeIdx;
      apply(ac.suggestions[idx]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setFocused(false);
      inputRef.current?.blur();
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
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-activedescendant={activeIdx >= 0 ? `jsonpath-option-${activeIdx}` : undefined}
      />
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-background shadow-lg"
        >
          {ac.suggestions.map((s, i) => (
            <li
              key={`${s}-${i}`}
              id={`jsonpath-option-${i}`}
              role="option"
              aria-selected={i === activeIdx}
            >
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  apply(s);
                }}
                onMouseEnter={() => setActiveIdx(i)}
                className={cn(
                  'block w-full cursor-pointer px-2 py-1 text-left font-mono text-xs',
                  i === activeIdx
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent',
                )}
              >
                {ac.prefix ? (
                  <>
                    <span
                      className={cn(
                        'font-semibold',
                        i === activeIdx ? 'text-primary-foreground' : 'text-primary',
                      )}
                    >
                      {s.slice(0, ac.prefix.length)}
                    </span>
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
          ↑ ↓ to choose · Tab / Enter to insert · Esc to dismiss
        </p>
      )}
    </div>
  );
}

/** Strip surrounding quotes (bracket-string suggestions) and lowercase. */
function normaliseToken(token: string): string {
  return token.replace(/^['"]/, '').replace(/['"]$/, '').toLowerCase();
}
