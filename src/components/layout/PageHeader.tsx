import { useLanguageStore } from '@/store/languageStore';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  const { language } = useLanguageStore();
  
  return (
    <div className="mb-8 flex items-center justify-between" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}