import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAppStore } from '@/store/appStore';
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
import { fr } from 'date-fns/locale';

const Dashboard = () => {
  const { clients, bonsReception, triturations, reservoirs, invoices } = useAppStore();

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
      header: 'N° BR | رقم الوصل',
      render: (br: typeof bonsReception[0]) => (
        <span className="font-medium text-primary">{br.number}</span>
      )
    },
    { 
      key: 'date', 
      header: 'Date | التاريخ',
      render: (br: typeof bonsReception[0]) => format(new Date(br.date), 'dd MMM yyyy', { locale: fr })
    },
    { 
      key: 'client', 
      header: 'Client | الحريف',
      render: (br: typeof bonsReception[0]) => {
        const client = clients.find(c => c.id === br.clientId);
        return client?.name || '-';
      }
    },
    { 
      key: 'poidsNet', 
      header: 'Poids Net | الوزن الصافي',
      render: (br: typeof bonsReception[0]) => `${br.poidsNet.toLocaleString()} kg`
    },
    { 
      key: 'status', 
      header: 'Statut | الحالة',
      render: (br: typeof bonsReception[0]) => (
        <StatusBadge status={br.status} />
      )
    },
  ];

  return (
    <MainLayout>
      <PageHeader 
        title="Tableau de bord | لوحة القيادة" 
        description="Vue d'ensemble de votre huilerie | نظرة عامة على معصرتك"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Clients | الحرفاء"
          value={clients.length}
          subtitle="Total enregistrés | إجمالي المسجلين"
          icon={Users}
        />
        <StatCard
          title="BR Ouverts | وصولات مفتوحة"
          value={openBRs.length}
          subtitle="En attente de trituration | في انتظار العصر"
          icon={Clock}
          variant="accent"
        />
        <StatCard
          title="Huile Produite | الزيت المنتج"
          value={`${formatNumber(totalHuile)} L`}
          subtitle="Total trituré | إجمالي المعصور"
          icon={Droplets}
        />
        <StatCard
          title="Stock Disponible | المخزون المتاح"
          value={`${formatNumber(stockTotal)} L`}
          subtitle={`${reservoirs.length} réservoirs | خزانات`}
          icon={Database}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold font-serif">{bonsReception.length}</p>
              <p className="text-sm text-muted-foreground">Bons de réception total | إجمالي وصولات الاستلام</p>
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
              <p className="text-sm text-muted-foreground">BR traités | وصولات معالجة</p>
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
              <p className="text-sm text-muted-foreground">Factures en attente | فواتير معلقة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent BRs */}
      <div className="mb-8">
        <h2 className="font-serif text-xl font-semibold mb-4">Derniers Bons de Réception | آخر وصولات الاستلام</h2>
        <DataTable
          columns={brColumns}
          data={recentBRs}
          emptyMessage="Aucun bon de réception | لا توجد وصولات استلام"
        />
      </div>

      {/* Reservoirs Status */}
      {reservoirs.length > 0 && (
        <div>
          <h2 className="font-serif text-xl font-semibold mb-4">État des Réservoirs | حالة الخزانات</h2>
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
                    <span>{reservoir.quantiteActuelle.toLocaleString()} L</span>
                    <span>{reservoir.capaciteMax.toLocaleString()} L max</span>
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