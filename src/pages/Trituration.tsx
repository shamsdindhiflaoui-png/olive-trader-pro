import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/appStore';
import { BonReception, Trituration as TriturationT } from '@/types';
import { Factory, Droplets, Scale, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const Trituration = () => {
  const { clients, bonsReception, triturations, addTrituration } = useAppStore();
  const [selectedBR, setSelectedBR] = useState<BonReception | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    quantiteHuile: '',
    observations: '',
  });

  // Filtres pour l'historique
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const openBRs = bonsReception.filter(br => br.status === 'open');

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      quantiteHuile: '',
      observations: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBR) return;

    if (!formData.quantiteHuile || Number(formData.quantiteHuile) <= 0) {
      toast.error('La quantité d\'huile obtenue est obligatoire');
      return;
    }

    addTrituration({
      brId: selectedBR.id,
      date: new Date(formData.date),
      quantiteHuile: Number(formData.quantiteHuile),
      observations: formData.observations || undefined,
    });

    toast.success(`BR ${selectedBR.number} trituré avec succès`);
    setSelectedBR(null);
    resetForm();
  };

  const getClient = (clientId: string) => clients.find(c => c.id === clientId);
  const getBR = (brId: string) => bonsReception.find(br => br.id === brId);

  // Filtrer les triturations par date
  const filteredTriturations = useMemo(() => {
    if (!dateDebut && !dateFin) return triturations;
    
    return triturations.filter(trit => {
      const tritDate = new Date(trit.date);
      const start = dateDebut ? startOfDay(parseISO(dateDebut)) : null;
      const end = dateFin ? endOfDay(parseISO(dateFin)) : null;

      if (start && end) {
        return isWithinInterval(tritDate, { start, end });
      } else if (start) {
        return tritDate >= start;
      } else if (end) {
        return tritDate <= end;
      }
      return true;
    });
  }, [triturations, dateDebut, dateFin]);

  // Statistiques filtrées
  const stats = useMemo(() => {
    const totalOlivesKg = filteredTriturations.reduce((sum, trit) => {
      const br = getBR(trit.brId);
      return sum + (br?.poidsNet || 0);
    }, 0);

    const totalHuileLitres = filteredTriturations.reduce((sum, trit) => sum + trit.quantiteHuile, 0);
    const rendementMoyen = totalOlivesKg > 0 ? (totalHuileLitres / totalOlivesKg) * 100 : 0;

    return {
      totalOlivesKg,
      totalHuileLitres,
      rendementMoyen,
      nombreTriturations: filteredTriturations.length,
    };
  }, [filteredTriturations, bonsReception]);

  const resetFilters = () => {
    setDateDebut('');
    setDateFin('');
  };

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (trit: TriturationT) => format(new Date(trit.date), 'dd/MM/yyyy', { locale: fr }),
    },
    {
      key: 'brNumber',
      header: 'N° BR',
      render: (trit: TriturationT) => getBR(trit.brId)?.number || '-',
    },
    {
      key: 'client',
      header: 'Client',
      render: (trit: TriturationT) => {
        const br = getBR(trit.brId);
        return br ? getClient(br.clientId)?.name || '-' : '-';
      },
    },
    {
      key: 'poidsNet',
      header: 'Olives (kg)',
      render: (trit: TriturationT) => {
        const br = getBR(trit.brId);
        return br ? `${br.poidsNet.toLocaleString()} kg` : '-';
      },
      className: 'text-right font-medium',
    },
    {
      key: 'quantiteHuile',
      header: 'Huile (L)',
      render: (trit: TriturationT) => `${trit.quantiteHuile.toLocaleString()} L`,
      className: 'text-right font-semibold text-primary',
    },
    {
      key: 'rendement',
      header: 'Rendement',
      render: (trit: TriturationT) => {
        const br = getBR(trit.brId);
        if (!br || br.poidsNet === 0) return '-';
        const rendement = (trit.quantiteHuile / br.poidsNet) * 100;
        return `${rendement.toFixed(1)}%`;
      },
      className: 'text-right',
    },
  ];

  return (
    <MainLayout>
      <PageHeader 
        title="Trituration" 
        description="Transformez les olives en huile et suivez l'historique"
      />

      <Tabs defaultValue="en-cours" className="space-y-6">
        <TabsList>
          <TabsTrigger value="en-cours">En cours ({openBRs.length})</TabsTrigger>
          <TabsTrigger value="historique">Historique ({triturations.length})</TabsTrigger>
        </TabsList>

        {/* Onglet BR en attente */}
        <TabsContent value="en-cours">
          {openBRs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <Factory className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Aucun BR en attente</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Tous les bons de réception ont été traités. Créez de nouveaux BR pour continuer la trituration.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {openBRs.map((br) => {
                const client = getClient(br.clientId);
                return (
                  <Card 
                    key={br.id} 
                    className="cursor-pointer transition-all duration-200 hover:shadow-medium hover:-translate-y-1"
                    onClick={() => setSelectedBR(br)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-serif text-lg">{br.number}</CardTitle>
                        <StatusBadge status="open" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Scale className="h-4 w-4" />
                          <span className="font-medium text-foreground">{br.poidsNet.toLocaleString()} kg</span>
                          <span>d'olives</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Client: </span>
                          <span className="font-medium">{client?.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Reçu le {format(new Date(br.date), 'dd MMM yyyy', { locale: fr })}
                        </div>
                        <Button className="w-full mt-2" variant="outline">
                          <Droplets className="mr-2 h-4 w-4" />
                          Triturer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Onglet Historique */}
        <TabsContent value="historique" className="space-y-6">
          {/* Filtres */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtrer par date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateDebut">Date début</Label>
                  <Input
                    id="dateDebut"
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="w-[180px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFin">Date fin</Label>
                  <Input
                    id="dateFin"
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="w-[180px]"
                  />
                </div>
                <Button variant="outline" onClick={resetFilters}>
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Olives traitées"
              value={`${stats.totalOlivesKg.toLocaleString()} kg`}
              icon={Scale}
              subtitle={dateDebut || dateFin ? 'Période filtrée' : 'Total'}
            />
            <StatCard
              title="Huile obtenue"
              value={`${stats.totalHuileLitres.toLocaleString()} L`}
              icon={Droplets}
              subtitle={dateDebut || dateFin ? 'Période filtrée' : 'Total'}
            />
            <StatCard
              title="Rendement moyen"
              value={`${stats.rendementMoyen.toFixed(1)}%`}
              icon={Factory}
              subtitle="Huile / Olives"
            />
            <StatCard
              title="Triturations"
              value={stats.nombreTriturations.toString()}
              icon={Calendar}
              subtitle={dateDebut || dateFin ? 'Période filtrée' : 'Total'}
            />
          </div>

          {/* Tableau historique */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Historique des triturations</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={filteredTriturations}
                emptyMessage="Aucune trituration enregistrée pour cette période"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trituration Dialog */}
      <Dialog open={!!selectedBR} onOpenChange={() => { setSelectedBR(null); resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Trituration - {selectedBR?.number}
            </DialogTitle>
            <DialogDescription>
              Enregistrez la quantité d'huile obtenue pour ce bon de réception.
            </DialogDescription>
          </DialogHeader>
          {selectedBR && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{getClient(selectedBR.clientId)?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Poids Net Olives</span>
                  <span className="font-semibold text-primary">{selectedBR.poidsNet.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date Réception</span>
                  <span>{format(new Date(selectedBR.date), 'dd MMM yyyy', { locale: fr })}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tritDate">Date de trituration *</Label>
                <Input
                  id="tritDate"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantiteHuile">Quantité d'huile obtenue (litres) *</Label>
                <Input
                  id="quantiteHuile"
                  type="number"
                  value={formData.quantiteHuile}
                  onChange={(e) => setFormData({ ...formData, quantiteHuile: e.target.value })}
                  placeholder="Ex: 150"
                  step="0.1"
                />
                {formData.quantiteHuile && selectedBR.poidsNet > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Rendement: {((Number(formData.quantiteHuile) / selectedBR.poidsNet) * 100).toFixed(1)}%
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tritObservations">Observations</Label>
                <Textarea
                  id="tritObservations"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Notes sur la trituration..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setSelectedBR(null)}>
                  Annuler
                </Button>
                <Button type="submit">
                  <Droplets className="mr-2 h-4 w-4" />
                  Valider la trituration
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Trituration;
