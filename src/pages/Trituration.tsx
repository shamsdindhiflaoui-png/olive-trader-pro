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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/appStore';
import { BonReception, Trituration as TriturationT } from '@/types';
import { Factory, Droplets, Scale, Calendar, Filter, Search, User, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { PDFDownloadButton } from '@/components/pdf/PDFDownloadButton';
import { BREnCoursPDF } from '@/components/pdf/BREnCoursPDF';
import { fr } from 'date-fns/locale';

const Trituration = () => {
  const { clients, bonsReception, triturations, addTrituration, settings } = useAppStore();
  const [selectedBR, setSelectedBR] = useState<BonReception | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    quantiteHuile: '',
    observations: '',
  });

  // Filtres pour l'historique
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [searchBR, setSearchBR] = useState('');
  const [searchBREnCours, setSearchBREnCours] = useState('');
  const [filterClientEnCours, setFilterClientEnCours] = useState('all');
  const openBRs = bonsReception.filter(br => br.status === 'open');
  
  // Clients ayant des BR en cours
  const clientsWithOpenBRs = useMemo(() => {
    const clientIds = [...new Set(openBRs.map(br => br.clientId))];
    return clients.filter(c => clientIds.includes(c.id));
  }, [openBRs, clients]);
  
  // Filtrer et trier les BR en cours
  const filteredOpenBRs = useMemo(() => {
    let result = openBRs;
    
    if (searchBREnCours.trim()) {
      result = result.filter(br => br.number.toLowerCase().includes(searchBREnCours.toLowerCase()));
    }
    
    if (filterClientEnCours && filterClientEnCours !== 'all') {
      result = result.filter(br => br.clientId === filterClientEnCours);
    }
    
    // Trier par date chronologique (plus ancien en premier)
    return [...result].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [openBRs, searchBREnCours, filterClientEnCours]);
  
  // Somme des quantités en cours
  const totalPoidsEnCours = useMemo(() => {
    return filteredOpenBRs.reduce((sum, br) => sum + br.poidsNet, 0);
  }, [filteredOpenBRs]);

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

  // Filtrer les triturations par date et recherche BR
  const filteredTriturations = useMemo(() => {
    let result = triturations;
    
    // Filtre par numéro BR
    if (searchBR.trim()) {
      result = result.filter(trit => {
        const br = getBR(trit.brId);
        return br?.number.toLowerCase().includes(searchBR.toLowerCase());
      });
    }
    
    // Filtre par date
    if (dateDebut || dateFin) {
      result = result.filter(trit => {
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
    }
    
    // Trier par date chronologique (plus ancien en premier)
    return [...result].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [triturations, dateDebut, dateFin, searchBR, bonsReception]);

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
    setSearchBR('');
  };

  const resetFiltersEnCours = () => {
    setSearchBREnCours('');
    setFilterClientEnCours('all');
  };

  // Colonnes pour le tableau des BR en cours
  const columnsEnCours = [
    {
      key: 'date',
      header: 'Date réception',
      render: (br: BonReception) => format(new Date(br.date), 'dd/MM/yyyy', { locale: fr }),
    },
    {
      key: 'number',
      header: 'N° BR',
      render: (br: BonReception) => <span className="font-medium">{br.number}</span>,
    },
    {
      key: 'client',
      header: 'Client',
      render: (br: BonReception) => getClient(br.clientId)?.name || '-',
    },
    {
      key: 'vehicle',
      header: 'Véhicule',
      render: (br: BonReception) => br.vehicle || '-',
    },
    {
      key: 'poidsNet',
      header: 'Poids Net (kg)',
      render: (br: BonReception) => `${br.poidsNet.toLocaleString()} kg`,
      className: 'text-right font-semibold',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (br: BonReception) => (
        <Button size="sm" variant="outline" onClick={() => setSelectedBR(br)}>
          <Droplets className="mr-1 h-3 w-3" />
          Triturer
        </Button>
      ),
      className: 'text-right',
    },
  ];

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
        <TabsContent value="en-cours" className="space-y-6">
          {/* Filtres et somme */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-2">
                    <Label>Rechercher par N° BR</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Ex: BR00001"
                        value={searchBREnCours}
                        onChange={(e) => setSearchBREnCours(e.target.value)}
                        className="w-[200px] pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Filtrer par client</Label>
                    <Select value={filterClientEnCours} onValueChange={setFilterClientEnCours}>
                      <SelectTrigger className="w-[220px]">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Tous les clients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les clients</SelectItem>
                        {clientsWithOpenBRs.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(searchBREnCours || filterClientEnCours !== 'all') && (
                    <Button variant="outline" onClick={resetFiltersEnCours}>
                      Réinitialiser
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Scale className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Total en cours:</span>
                    <span className="text-lg font-bold text-primary">{totalPoidsEnCours.toLocaleString()} kg</span>
                    <span className="text-sm text-muted-foreground">({filteredOpenBRs.length} BR)</span>
                  </div>
                  {filteredOpenBRs.length > 0 && (
                    <PDFDownloadButton
                      document={
                        <BREnCoursPDF
                          brs={filteredOpenBRs}
                          clients={clients}
                          settings={settings}
                          filterInfo={
                            filterClientEnCours !== 'all'
                              ? clientsWithOpenBRs.find(c => c.id === filterClientEnCours)?.name
                              : undefined
                          }
                        />
                      }
                      fileName={`BR-en-cours-${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                      label="Exporter PDF"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des BR en cours */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Bons de réception en attente de trituration</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columnsEnCours}
                data={filteredOpenBRs}
                emptyMessage={
                  searchBREnCours || filterClientEnCours !== 'all'
                    ? 'Aucun BR ne correspond à vos critères de recherche.'
                    : 'Aucun BR en attente de trituration.'
                }
              />
            </CardContent>
          </Card>
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
                  <Label htmlFor="searchBR">Rechercher par N° BR</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="searchBR"
                      type="text"
                      placeholder="Ex: BR00001"
                      value={searchBR}
                      onChange={(e) => setSearchBR(e.target.value)}
                      className="w-[200px] pl-9"
                    />
                  </div>
                </div>
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
