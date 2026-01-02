import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useAppStore } from '@/store/appStore';
import { BonReception } from '@/types';
import { Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const BonsReception = () => {
  const { clients, bonsReception, addBR } = useAppStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingBR, setViewingBR] = useState<BonReception | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    clientId: '',
    poidsPlein: '',
    poidsVide: '',
    vehicle: '',
    observations: '',
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      clientId: '',
      poidsPlein: '',
      poidsVide: '',
      vehicle: '',
      observations: '',
    });
  };

  const poidsNet = formData.poidsPlein && formData.poidsVide 
    ? Number(formData.poidsPlein) - Number(formData.poidsVide) 
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }

    if (!formData.poidsPlein || !formData.poidsVide) {
      toast.error('Les poids sont obligatoires');
      return;
    }

    if (poidsNet <= 0) {
      toast.error('Le poids net doit être positif');
      return;
    }

    addBR({
      date: new Date(formData.date),
      clientId: formData.clientId,
      poidsPlein: Number(formData.poidsPlein),
      poidsVide: Number(formData.poidsVide),
      vehicle: formData.vehicle || undefined,
      observations: formData.observations || undefined,
    });

    toast.success('Bon de réception créé avec succès');
    setIsDialogOpen(false);
    resetForm();
  };

  const columns = [
    { 
      key: 'number', 
      header: 'N° BR',
      render: (br: BonReception) => (
        <span className="font-medium text-primary">{br.number}</span>
      )
    },
    { 
      key: 'date', 
      header: 'Date',
      render: (br: BonReception) => format(new Date(br.date), 'dd MMM yyyy', { locale: fr })
    },
    { 
      key: 'client', 
      header: 'Client',
      render: (br: BonReception) => {
        const client = clients.find(c => c.id === br.clientId);
        return client?.name || '-';
      }
    },
    { 
      key: 'poidsPlein', 
      header: 'Poids Plein',
      render: (br: BonReception) => `${br.poidsPlein.toLocaleString()} kg`
    },
    { 
      key: 'poidsVide', 
      header: 'Poids Vide',
      render: (br: BonReception) => `${br.poidsVide.toLocaleString()} kg`
    },
    { 
      key: 'poidsNet', 
      header: 'Poids Net',
      render: (br: BonReception) => (
        <span className="font-semibold text-primary">{br.poidsNet.toLocaleString()} kg</span>
      )
    },
    { 
      key: 'status', 
      header: 'Statut',
      render: (br: BonReception) => <StatusBadge status={br.status} />
    },
    { 
      key: 'actions', 
      header: 'Actions',
      render: (br: BonReception) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); setViewingBR(br); }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    },
  ];

  return (
    <MainLayout>
      <PageHeader 
        title="Bons de Réception" 
        description="Gérez les entrées d'olives"
        action={
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau BR
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif">Nouveau Bon de Réception</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client *</Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} ({client.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="poidsPlein">Poids Plein (kg) *</Label>
                    <Input
                      id="poidsPlein"
                      type="number"
                      value={formData.poidsPlein}
                      onChange={(e) => setFormData({ ...formData, poidsPlein: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="poidsVide">Poids Vide (kg) *</Label>
                    <Input
                      id="poidsVide"
                      type="number"
                      value={formData.poidsVide}
                      onChange={(e) => setFormData({ ...formData, poidsVide: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Poids Net (kg)</Label>
                    <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-semibold text-primary">
                      {poidsNet.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle">Véhicule</Label>
                  <Input
                    id="vehicle"
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    placeholder="Immatriculation ou description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observations</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    placeholder="Notes additionnelles..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Créer le BR</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {clients.length === 0 && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning">
          <p className="text-sm font-medium">
            Aucun client enregistré. Veuillez d'abord créer des clients avant de créer des bons de réception.
          </p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={[...bonsReception].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )}
        emptyMessage="Aucun bon de réception. Cliquez sur 'Nouveau BR' pour commencer."
      />

      {/* View BR Dialog */}
      <Dialog open={!!viewingBR} onOpenChange={() => setViewingBR(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Détails du BR {viewingBR?.number}
            </DialogTitle>
          </DialogHeader>
          {viewingBR && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(viewingBR.date), 'dd MMMM yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Statut</p>
                  <StatusBadge status={viewingBR.status} />
                </div>
                <div>
                  <p className="text-muted-foreground">Client</p>
                  <p className="font-medium">{clients.find(c => c.id === viewingBR.clientId)?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Véhicule</p>
                  <p className="font-medium">{viewingBR.vehicle || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Poids Plein</p>
                  <p className="font-medium">{viewingBR.poidsPlein.toLocaleString()} kg</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Poids Vide</p>
                  <p className="font-medium">{viewingBR.poidsVide.toLocaleString()} kg</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Poids Net</p>
                  <p className="text-2xl font-semibold text-primary">{viewingBR.poidsNet.toLocaleString()} kg</p>
                </div>
              </div>
              {viewingBR.observations && (
                <div>
                  <p className="text-muted-foreground text-sm">Observations</p>
                  <p className="text-sm">{viewingBR.observations}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default BonsReception;
