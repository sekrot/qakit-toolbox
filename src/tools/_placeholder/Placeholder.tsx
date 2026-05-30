import { Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Placeholder() {
  const { t } = useTranslation('common');
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <Construction className="h-10 w-10" />
      <p className="text-sm">{t('appName')} — coming soon</p>
    </div>
  );
}
