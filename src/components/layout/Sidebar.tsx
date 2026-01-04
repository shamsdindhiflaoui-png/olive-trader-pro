import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Factory, 
  Database, 
  ShoppingCart,
  CreditCard,
  Settings,
  Droplets
} from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguageStore } from '@/store/languageStore';

const navItems = [
  { path: '/', labelFr: 'Tableau de bord', labelAr: 'لوحة القيادة', icon: LayoutDashboard },
  { path: '/clients', labelFr: 'Clients', labelAr: 'الحرفاء', icon: Users },
  { path: '/bons-reception', labelFr: 'Bons de Réception', labelAr: 'وصولات الاستلام', icon: FileText },
  { path: '/trituration', labelFr: 'Trituration', labelAr: 'العصر', icon: Factory },
  { path: '/stock', labelFr: 'Stock', labelAr: 'المخزون', icon: Database },
  { path: '/vente', labelFr: 'Vente', labelAr: 'البيع', icon: ShoppingCart },
  { path: '/paiement', labelFr: 'Paiement', labelAr: 'الدفع', icon: CreditCard },
  { path: '/parametres', labelFr: 'Paramètres', labelAr: 'الإعدادات', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { language, t } = useLanguageStore();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <Droplets className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold">{t('Huilerie', 'معصرة')}</h1>
            <p className="text-xs text-sidebar-foreground/70">{t('Gestion des olives', 'إدارة الزيتون')}</p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="px-3 py-2 border-b border-sidebar-border">
          <LanguageSelector />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const label = language === 'fr' ? item.labelFr : item.labelAr;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/60 text-center">
            © 2024 Olive Mill Manager
          </p>
        </div>
      </div>
    </aside>
  );
}