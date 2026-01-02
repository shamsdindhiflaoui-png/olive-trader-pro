import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
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
} from '@/components/ui/dialog';
import { useAppStore } from '@/store/appStore';
import { BonReception } from '@/types';
import { Factory, Droplets, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Trituration = () => {
  const { clients, bonsReception, addTrituration } = useAppStore();
  const [selectedBR, setSelectedBR] = useState<BonReception | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    quantiteHuile: '',
    observations: '',
  });

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

  return (
    <MainLayout>
      <PageHeader 
        title="Trituration" 
        description="Transformez les olives en huile"
      />

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

      {/* Trituration Dialog */}
      <Dialog open={!!selectedBR} onOpenChange={() => { setSelectedBR(null); resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Trituration - {selectedBR?.number}
            </DialogTitle>
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
