import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  align?: 'start' | 'center' | 'end';
  className?: string;
  children: ReactNode;
}

/** Anchored popover portaled to `document.body` and positioned with `position: fixed`
 * from the anchor's viewport rect — avoids clipping by scrollable/overflow-hidden
 * ancestors, which the side panel's toolbar and canvas wrapper both are. */
export function Popover({
  open,
  onClose,
  anchorRef,
  align = 'start',
  className,
  children,
}: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    const popover = popoverRef.current;
    if (!anchor || !popover) return;
    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    let left = anchorRect.left;
    if (align === 'center') left = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2;
    if (align === 'end') left = anchorRect.right - popoverRect.width;
    left = Math.min(Math.max(8, left), window.innerWidth - popoverRect.width - 8);
    const top = anchorRect.bottom + 4;
    setPos({ top, left });
  }, [open, align, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      className={cn(
        'fixed z-50 min-w-[9rem] rounded-md border border-border bg-background p-1.5 shadow-lg',
        className,
      )}
      style={pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 }}
    >
      {children}
    </div>,
    document.body,
  );
}
