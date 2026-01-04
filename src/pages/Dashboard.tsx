import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAppStore } from '@/store/appStore';
import { useLanguageStore } from '@/store/languageStore';
import { formatNumber } from '@/lib/utils';
import { 
  Users, 
  FileText, 
  Droplets, 
  Database,
  TrendingUp,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { fr, ar } from 'date-fns/locale';

const Dashboard = () => {
  const { clients, bonsReception, triturations, reservoirs, invoices } = useAppStore();
  const { t, language } = useLanguageStore();

  const dateLocale = language === 'ar' ? ar : fr;

  const openBRs = bonsReception.filter(br => br.status === 'open');
  const closedBRs = bonsReception.filter(br => br.status === 'closed');
  const totalHuile = triturations.reduce((acc, t) => acc + t.quantiteHuile, 0);
  const stockTotal = reservoirs.reduce((acc, r) => acc + r.quantiteActuelle, 0);
  const unpaidInvoices = invoices.filter(i => i.status !== 'paye');

  const recentBRs = [...bonsReception]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const brColumns = [
    { 
      key: 'number', 
      header: t('N° BR', 'رقم الوصل'),
      render: (br: typeof bonsReception[0]) => (
        <span className="font-medium text-primary">{br.number}</span>
      )
    },
    { 
      key: 'date', 
      header: t('Date', 'التاريخ'),
      render: (br: typeof bonsReception[0]) => format(new Date(br.date), 'dd MMM yyyy', { locale: dateLocale })
    },
    { 
      key: 'client', 
      header: t('Client', 'الحريف'),
      render: (br: typeof bonsReception[0]) => {
        const client = clients.find(c => c.id === br.clientId);
        return client?.name || '-';
      }
    },
    { 
      key: 'poidsNet', 
      header: t('Poids Net', 'الوزن الصافي'),
      render: (br: typeof bonsReception[0]) => `${br.poidsNet.toLocaleString()} kg`
    },
    { 
      key: 'status', 
      header: t('Statut', 'الحالة'),
      render: (br: typeof bonsReception[0]) => (
        <StatusBadge status={br.status} />
      )
    },
  ];

  return (
    <MainLayout>
      <PageHeader 
        title={t('Tableau de bord', 'لوحة القيادة')} 
        description={t("Vue d'ensemble de votre huilerie", 'نظرة عامة على معصرتك')}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <StatCard
          title={t('Clients', 'الحرفاء')}
          value={clients.length}
          subtitle={t('Total enregistrés', 'إجمالي المسجلين')}
          icon={Users}
        />
        <StatCard
          title={t('BR Ouverts', 'وصولات مفتوحة')}
          value={openBRs.length}
          subtitle={t('En attente de trituration', 'في انتظار العصر')}
          icon={Clock}
          variant="accent"
        />
        <StatCard
          title={t('Huile Produite', 'الزيت المنتج')}
          value={`${formatNumber(totalHuile)} kg`}
          subtitle={t('Total trituré', 'إجمالي المعصور')}
          icon={Droplets}
        />
        <StatCard
          title={t('Stock Disponible', 'المخزون المتاح')}
          value={`${formatNumber(stockTotal)} kg`}
          subtitle={t(`${reservoirs.length} réservoirs`, `${reservoirs.length} خزانات`)}
          icon={Database}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold font-serif">{bonsReception.length}</p>
              <p className="text-sm text-muted-foreground">{t('Bons de réception total', 'إجمالي وصولات الاستلام')}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold font-serif">{closedBRs.length}</p>
              <p className="text-sm text-muted-foreground">{t('BR traités', 'وصولات معالجة')}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Droplets className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold font-serif">{unpaidInvoices.length}</p>
              <p className="text-sm text-muted-foreground">{t('Factures en attente', 'فواتير معلقة')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent BRs */}
      <div className="mb-8">
        <h2 className="font-serif text-xl font-semibold mb-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {t('Derniers Bons de Réception', 'آخر وصولات الاستلام')}
        </h2>
        <DataTable
          columns={brColumns}
          data={recentBRs}
          emptyMessage={t('Aucun bon de réception', 'لا توجد وصولات استلام')}
        />
      </div>

      {/* Reservoirs Status */}
      {reservoirs.length > 0 && (
        <div>
          <h2 className="font-serif text-xl font-semibold mb-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {t('État des Réservoirs', 'حالة الخزانات')}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reservoirs.map((reservoir) => {
              const fillPercentage = (reservoir.quantiteActuelle / reservoir.capaciteMax) * 100;
              return (
                <div key={reservoir.id} className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">{reservoir.code}</span>
                    <StatusBadge status={reservoir.status} />
                  </div>
                  <div className="mb-2">
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full rounded-full golden-gradient transition-all duration-500"
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{reservoir.quantiteActuelle.toLocaleString()} kg</span>
                    <span>{reservoir.capaciteMax.toLocaleString()} kg max</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Dashboard;