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

const navItems = [
  { path: '/', label: 'Tableau de bord', labelAr: 'لوحة القيادة', icon: LayoutDashboard },
  { path: '/clients', label: 'Clients', labelAr: 'الحرفاء', icon: Users },
  { path: '/bons-reception', label: 'Bons de Réception', labelAr: 'وصولات الاستلام', icon: FileText },
  { path: '/trituration', label: 'Trituration', labelAr: 'العصر', icon: Factory },
  { path: '/stock', label: 'Stock', labelAr: 'المخزون', icon: Database },
  { path: '/vente', label: 'Vente', labelAr: 'البيع', icon: ShoppingCart },
  { path: '/paiement', label: 'Paiement', labelAr: 'الدفع', icon: CreditCard },
  { path: '/parametres', label: 'Paramètres', labelAr: 'الإعدادات', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <Droplets className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold">Huilerie <span className="text-sm font-normal opacity-80">معصرة</span></h1>
            <p className="text-xs text-sidebar-foreground/70">Gestion des olives | إدارة الزيتون</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
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
              >
                <Icon className="h-5 w-5" />
                <div className="flex flex-col">
                  <span>{item.label}</span>
                  <span className="text-xs opacity-70" dir="rtl">{item.labelAr}</span>
                </div>
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