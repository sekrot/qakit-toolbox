import { Suspense, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TOOLS } from '@/tools/registry';
import { useSettings } from '@/storage/store';
import { recordToolOpen } from '@/storage/telemetry';

export function ToolScreen() {
  const { toolId } = useParams<{ toolId: string }>();
  const { t } = useTranslation('tools');
  const pushRecentTool = useSettings((s) => s.pushRecentTool);
  const tool = TOOLS.find((t) => t.id === toolId);

  useEffect(() => {
    if (tool) {
      pushRecentTool(tool.id);
      void recordToolOpen(tool.id);
    }
  }, [tool, pushRecentTool]);

  if (!tool) {
    return <div className="p-4 text-sm text-muted-foreground">Tool not found</div>;
  }

  const Component = tool.component;
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-2">
        <h1 className="text-sm font-semibold">{t(tool.nameKey)}</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
          <Component />
        </Suspense>
      </div>
    </div>
  );
}
