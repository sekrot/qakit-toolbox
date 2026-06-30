import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface JsonTreeProps {
  value: unknown;
}

export function JsonTree({ value }: JsonTreeProps) {
  return (
    <div className="font-mono text-xs leading-relaxed">
      <JsonNode value={value} depth={0} isLast />
    </div>
  );
}

interface NodeProps {
  value: unknown;
  name?: string;
  depth: number;
  isLast: boolean;
}

function JsonNode({ value, name, depth, isLast }: NodeProps) {
  // Top two levels open by default; deeper nodes collapsed to keep big payloads
  // scannable on first render.
  const [expanded, setExpanded] = useState(depth < 2);

  if (value === null || typeof value !== 'object') {
    return (
      <div className="flex">
        {name !== undefined && <Key name={name} />}
        <Primitive value={value} />
        {!isLast && <span>,</span>}
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);
  const count = entries.length;
  const open = isArray ? '[' : '{';
  const close = isArray ? ']' : '}';

  if (count === 0) {
    return (
      <div className="flex">
        {name !== undefined && <Key name={name} />}
        <span>
          {open}
          {close}
        </span>
        {!isLast && <span>,</span>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        className="flex w-full select-none items-center rounded text-left hover:bg-accent/40"
      >
        <ChevronRight
          className={cn(
            'mr-0.5 h-3 w-3 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-90',
          )}
        />
        {name !== undefined && <Key name={name} />}
        <span>{open}</span>
        {!expanded && (
          <>
            <span className="px-1 italic text-muted-foreground">
              {count} {isArray ? (count === 1 ? 'item' : 'items') : count === 1 ? 'key' : 'keys'}
            </span>
            <span>{close}</span>
            {!isLast && <span>,</span>}
          </>
        )}
      </button>
      {expanded && (
        <>
          <div className="ml-[7px] border-l border-border/50 pl-3">
            {entries.map(([k, v], i) => (
              <JsonNode
                key={k}
                value={v}
                name={isArray ? undefined : k}
                depth={depth + 1}
                isLast={i === entries.length - 1}
              />
            ))}
          </div>
          <div className="ml-[14px]">
            {close}
            {!isLast && ','}
          </div>
        </>
      )}
    </div>
  );
}

function Key({ name }: { name: string }) {
  return <span className="mr-1 text-primary">&quot;{name}&quot;:</span>;
}

function Primitive({ value }: { value: unknown }) {
  if (value === null) return <span className="italic text-muted-foreground">null</span>;
  if (typeof value === 'string')
    return <span className="text-emerald-600 dark:text-emerald-400">&quot;{value}&quot;</span>;
  if (typeof value === 'number')
    return <span className="text-amber-600 dark:text-amber-400">{value}</span>;
  if (typeof value === 'boolean')
    return <span className="text-violet-600 dark:text-violet-400">{String(value)}</span>;
  return <span>{String(value)}</span>;
}
