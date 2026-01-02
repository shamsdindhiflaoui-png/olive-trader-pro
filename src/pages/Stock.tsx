import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAppStore } from '@/store/appStore';
import { Reservoir, BonReception, Trituration } from '@/types';
import { Plus, Database, Droplets } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const transactionTypeLabels = {
  facon: 'Façon (Service)',
  bawaza: 'Bawaza',
  achat_base: 'Achat à la base',
};

const Stock = () => {
  const { 
    clients, 
    bonsReception, 
    triturations, 
    reservoirs, 
    stockAffectations,
    settings,
    addReservoir, 
    affectToReservoir 
  } = useAppStore();
  
  const [isReservoirDialogOpen, setIsReservoirDialogOpen] = useState(false);
  const [isAffectDialogOpen, setIsAffectDialogOpen] = useState(false);
  const [selectedTrit, setSelectedTrit] = useState<{ br: BonReception; trit: Trituration } | null>(null);
  const [reservoirForm, setReservoirForm] = useState({
    code: '',
    capaciteMax: '',
    observations: '',
  });
  const [affectForm, setAffectForm] = useState({
    reservoirId: '',
    quantite: '',
  });

  // Get closed BRs that haven't been fully affected to stock
  const closedBRs = bonsReception.filter(br => br.status === 'closed');
  const tritsByBR = triturations.reduce((acc, t) => {
    acc[t.brId] = t;
    return acc;
  }, {} as Record<string, Trituration>);

  // Get BRs pending stock affectation (only Bawaza and Achat à la base)
  const pendingAffectations = closedBRs
    .filter(br => {
      const client = clients.find(c => c.id === br.clientId);
      if (!client) return false;
      // Façon doesn't affect stock
      if (client.transactionType === 'facon') return false;
      
      // Check if already fully affected
      const affectations = stockAffectations.filter(a => a.brId === br.id);
      const totalAffected = affectations.reduce((sum, a) => sum + a.quantite, 0);
      const trit = tritsByBR[br.id];
      if (!trit) return false;
      
      // For Bawaza, only huilerie part should be affected
      const targetQuantity = client.transactionType === 'bawaza' 
        ? (trit.quantiteHuile * settings.partHuilerieBawaza) / 100
        : trit.quantiteHuile;
      
      return totalAffected < targetQuantity;
    })
    .map(br => ({
      br,
      trit: tritsByBR[br.id],
      client: clients.find(c => c.id === br.clientId)!,
    }));

  const handleAddReservoir = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reservoirForm.code || !reservoirForm.capaciteMax) {
      toast.error('Le code et la capacité sont obligatoires');
      return;
    }

    addReservoir({
      code: reservoirForm.code,
      capaciteMax: Number(reservoirForm.capaciteMax),
      quantiteActuelle: 0,
      status: 'disponible',
      observations: reservoirForm.observations || undefined,
    });

    toast.success('Réservoir ajouté avec succès');
    setIsReservoirDialogOpen(false);
    setReservoirForm({ code: '', capaciteMax: '', observations: '' });
  };

  const handleAffect = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTrit || !affectForm.reservoirId || !affectForm.quantite) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const quantity = Number(affectForm.quantite);
    const success = affectToReservoir(affectForm.reservoirId, quantity, selectedTrit.br.id);

    if (success) {
      toast.success('Huile affectée au réservoir avec succès');
      setIsAffectDialogOpen(false);
      setSelectedTrit(null);
      setAffectForm({ reservoirId: '', quantite: '' });
    } else {
      toast.error('Capacité du réservoir insuffisante');
    }
  };

  const openAffectDialog = (br: BonReception, trit: Trituration) => {
    setSelectedTrit({ br, trit });
    setIsAffectDialogOpen(true);
  };

  const reservoirColumns = [
    { 
      key: 'code', 
      header: 'Code',
      render: (r: Reservoir) => <span className="font-medium text-primary">{r.code}</span>
    },
    { 
      key: 'capaciteMax', 
      header: 'Capacité Max',
      render: (r: Reservoir) => `${r.capaciteMax.toLocaleString()} L`
    },
    { 
      key: 'quantiteActuelle', 
      header: 'Quantité Actuelle',
      render: (r: Reservoir) => `${r.quantiteActuelle.toLocaleString()} L`
    },
    { 
      key: 'fill', 
      header: 'Remplissage',
      render: (r: Reservoir) => {
        const percentage = (r.quantiteActuelle / r.capaciteMax) * 100;
        return (
          <div className="w-24">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full rounded-full golden-gradient"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{percentage.toFixed(0)}%</p>
          </div>
        );
      }
    },
    { 
      key: 'status', 
      header: 'Statut',
      render: (r: Reservoir) => <StatusBadge status={r.status} />
    },
  ];

  return (
    <MainLayout>
      <PageHeader 
        title="Gestion du Stock" 
        description="Gérez vos réservoirs et l'huile produite"
        action={
          <Dialog open={isReservoirDialogOpen} onOpenChange={setIsReservoirDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Réservoir
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif">Nouveau Réservoir</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddReservoir} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code du réservoir *</Label>
                  <Input
                    id="code"
                    value={reservoirForm.code}
                    onChange={(e) => setReservoirForm({ ...reservoirForm, code: e.target.value })}
                    placeholder="Ex: RES-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacite">Capacité maximale (litres) *</Label>
                  <Input
                    id="capacite"
                    type="number"
                    value={reservoirForm.capaciteMax}
                    onChange={(e) => setReservoirForm({ ...reservoirForm, capaciteMax: e.target.value })}
                    placeholder="Ex: 1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resObservations">Observations</Label>
                  <Textarea
                    id="resObservations"
                    value={reservoirForm.observations}
                    onChange={(e) => setReservoirForm({ ...reservoirForm, observations: e.target.value })}
                    placeholder="Notes..."
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsReservoirDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Créer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="reservoirs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reservoirs" className="gap-2">
            <Database className="h-4 w-4" />
            Réservoirs
          </TabsTrigger>
          <TabsTrigger value="affectation" className="gap-2">
            <Droplets className="h-4 w-4" />
            Affectation ({pendingAffectations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reservoirs">
          <DataTable
            columns={reservoirColumns}
            data={reservoirs}
            emptyMessage="Aucun réservoir. Créez des réservoirs pour gérer votre stock d'huile."
          />
        </TabsContent>

        <TabsContent value="affectation">
          {pendingAffectations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <Droplets className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Aucune affectation en attente</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Les BR de type Façon n'impactent pas le stock. Seuls les BR Bawaza et Achat à la base apparaissent ici.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingAffectations.map(({ br, trit, client }) => {
                const affectations = stockAffectations.filter(a => a.brId === br.id);
                const totalAffected = affectations.reduce((sum, a) => sum + a.quantite, 0);
                const targetQuantity = client.transactionType === 'bawaza' 
                  ? (trit.quantiteHuile * settings.partHuilerieBawaza) / 100
                  : trit.quantiteHuile;
                const remaining = targetQuantity - totalAffected;

                return (
                  <Card key={br.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-serif text-lg">{br.number}</CardTitle>
                        <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                          {transactionTypeLabels[client.transactionType]}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Client: </span>
                        <span className="font-medium">{client.name}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Huile produite: </span>
                        <span className="font-medium">{trit.quantiteHuile.toLocaleString()} L</span>
                      </div>
                      {client.transactionType === 'bawaza' && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Part huilerie ({settings.partHuilerieBawaza}%): </span>
                          <span className="font-semibold text-primary">{targetQuantity.toFixed(1)} L</span>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-muted-foreground">Reste à affecter: </span>
                        <span className="font-semibold text-warning">{remaining.toFixed(1)} L</span>
                      </div>
                      <Button 
                        className="w-full mt-2" 
                        onClick={() => openAffectDialog(br, trit)}
                        disabled={reservoirs.filter(r => r.status !== 'plein').length === 0}
                      >
                        Affecter au stock
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Affectation Dialog */}
      <Dialog open={isAffectDialogOpen} onOpenChange={() => { setIsAffectDialogOpen(false); setSelectedTrit(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Affecter l'huile au stock
            </DialogTitle>
          </DialogHeader>
          {selectedTrit && (
            <form onSubmit={handleAffect} className="space-y-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">BR</span>
                  <span className="font-medium">{selectedTrit.br.number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Huile disponible</span>
                  <span className="font-semibold text-primary">{selectedTrit.trit.quantiteHuile.toLocaleString()} L</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Réservoir *</Label>
                <Select
                  value={affectForm.reservoirId}
                  onValueChange={(value) => setAffectForm({ ...affectForm, reservoirId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un réservoir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {reservoirs.filter(r => r.status !== 'plein').map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.code} - Dispo: {(r.capaciteMax - r.quantiteActuelle).toLocaleString()} L
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantité à affecter (litres) *</Label>
                <Input
                  type="number"
                  value={affectForm.quantite}
                  onChange={(e) => setAffectForm({ ...affectForm, quantite: e.target.value })}
                  placeholder="0"
                  step="0.1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAffectDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Affecter</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Stock;
