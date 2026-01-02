import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { BonReception, Trituration, Payment } from '@/types';
import { CreditCard, Receipt, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const transactionTypeLabels = {
  facon: 'Façon (Service)',
  bawaza: 'Bawaza',
  achat_base: 'Achat à la base',
};

const paymentModes = [
  'Espèces',
  'Chèque',
  'Virement',
  'Carte bancaire',
];

const Paiements = () => {
  const { 
    clients, 
    bonsReception, 
    triturations, 
    payments,
    settings,
    addPayment 
  } = useAppStore();
  
  const [selectedBR, setSelectedBR] = useState<{ br: BonReception; trit: Trituration } | null>(null);
  const [formData, setFormData] = useState({
    prixUnitaire: '',
    modePayment: '',
    date: new Date().toISOString().split('T')[0],
  });

  const tritsByBR = triturations.reduce((acc, t) => {
    acc[t.brId] = t;
    return acc;
  }, {} as Record<string, Trituration>);

  const paidBRIds = new Set(payments.map(p => p.brId));

  // Get closed BRs that haven't been paid
  const unpaidBRs = bonsReception
    .filter(br => br.status === 'closed' && !paidBRIds.has(br.id))
    .map(br => ({
      br,
      trit: tritsByBR[br.id],
      client: clients.find(c => c.id === br.clientId)!,
    }))
    .filter(item => item.trit && item.client);

  const paidPayments = payments.filter(p => p.status === 'paye');

  const resetForm = () => {
    setFormData({
      prixUnitaire: '',
      modePayment: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const calculateAmount = () => {
    if (!selectedBR || !formData.prixUnitaire) return 0;
    const client = clients.find(c => c.id === selectedBR.br.clientId);
    if (!client) return 0;

    const prix = Number(formData.prixUnitaire);

    if (client.transactionType === 'facon') {
      // Façon: Client pays based on olive weight
      return selectedBR.br.poidsNet * prix;
    } else {
      // Bawaza & Achat à la base: Huilerie pays based on oil quantity
      return selectedBR.trit.quantiteHuile * prix;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBR || !formData.prixUnitaire || !formData.modePayment) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const montant = calculateAmount();
    const client = clients.find(c => c.id === selectedBR.br.clientId);

    addPayment({
      brId: selectedBR.br.id,
      montant,
      prixUnitaire: Number(formData.prixUnitaire),
      modePayment: formData.modePayment,
      date: new Date(formData.date),
      status: 'paye',
    });

    const direction = client?.transactionType === 'facon' 
      ? 'reçu du client' 
      : 'versé au client';
    
    toast.success(`Paiement de ${montant.toFixed(2)} DT ${direction}`);
    setSelectedBR(null);
    resetForm();
  };

  const openPaymentDialog = (br: BonReception, trit: Trituration) => {
    const client = clients.find(c => c.id === br.clientId);
    setSelectedBR({ br, trit });
    
    // Set default price based on transaction type
    if (client?.transactionType === 'facon') {
      setFormData(prev => ({ ...prev, prixUnitaire: String(settings.defaultPrixFacon) }));
    } else {
      setFormData(prev => ({ ...prev, prixUnitaire: String(settings.defaultPrixBase) }));
    }
  };

  const paymentColumns = [
    { 
      key: 'brNumber', 
      header: 'N° BR',
      render: (p: Payment) => {
        const br = bonsReception.find(b => b.id === p.brId);
        return <span className="font-medium text-primary">{br?.number}</span>;
      }
    },
    { 
      key: 'client', 
      header: 'Client',
      render: (p: Payment) => {
        const br = bonsReception.find(b => b.id === p.brId);
        const client = clients.find(c => c.id === br?.clientId);
        return client?.name || '-';
      }
    },
    { 
      key: 'type', 
      header: 'Type',
      render: (p: Payment) => {
        const br = bonsReception.find(b => b.id === p.brId);
        const client = clients.find(c => c.id === br?.clientId);
        return client ? transactionTypeLabels[client.transactionType] : '-';
      }
    },
    { 
      key: 'montant', 
      header: 'Montant',
      render: (p: Payment) => {
        const br = bonsReception.find(b => b.id === p.brId);
        const client = clients.find(c => c.id === br?.clientId);
        const direction = client?.transactionType === 'facon' ? '+' : '-';
        return (
          <span className={client?.transactionType === 'facon' ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
            {direction} {p.montant.toFixed(2)} DT
          </span>
        );
      }
    },
    { 
      key: 'mode', 
      header: 'Mode',
      render: (p: Payment) => p.modePayment
    },
    { 
      key: 'date', 
      header: 'Date',
      render: (p: Payment) => format(new Date(p.date), 'dd MMM yyyy', { locale: fr })
    },
    { 
      key: 'status', 
      header: 'Statut',
      render: () => <StatusBadge status="paid" />
    },
  ];

  return (
    <MainLayout>
      <PageHeader 
        title="Paiements" 
        description="Gérez les paiements clients"
      />

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            En attente ({unpaidBRs.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Effectués ({paidPayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {unpaidBRs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <CreditCard className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Aucun paiement en attente</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Tous les BR fermés ont été payés.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {unpaidBRs.map(({ br, trit, client }) => {
                const isFacon = client.transactionType === 'facon';
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
                      
                      {isFacon ? (
                        <>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Poids olives: </span>
                            <span className="font-medium">{br.poidsNet.toLocaleString()} kg</span>
                          </div>
                          <div className="p-2 rounded bg-success/10 text-success text-sm">
                            <Receipt className="inline h-4 w-4 mr-1" />
                            Le client doit payer l'huilerie
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Huile produite: </span>
                            <span className="font-medium">{trit.quantiteHuile.toLocaleString()} L</span>
                          </div>
                          <div className="p-2 rounded bg-warning/10 text-warning text-sm">
                            <Receipt className="inline h-4 w-4 mr-1" />
                            L'huilerie doit payer le client
                          </div>
                        </>
                      )}
                      
                      <Button 
                        className="w-full mt-2" 
                        onClick={() => openPaymentDialog(br, trit)}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Enregistrer le paiement
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          <DataTable
            columns={paymentColumns}
            data={[...paidPayments].sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            )}
            emptyMessage="Aucun paiement effectué"
          />
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={!!selectedBR} onOpenChange={() => { setSelectedBR(null); resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Paiement - {selectedBR?.br.number}
            </DialogTitle>
          </DialogHeader>
          {selectedBR && (() => {
            const client = clients.find(c => c.id === selectedBR.br.clientId);
            const isFacon = client?.transactionType === 'facon';
            const montant = calculateAmount();
            
            return (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Client</span>
                    <span className="font-medium">{client?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span>{client && transactionTypeLabels[client.transactionType]}</span>
                  </div>
                  {isFacon ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Poids Net</span>
                      <span className="font-semibold">{selectedBR.br.poidsNet.toLocaleString()} kg</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quantité Huile</span>
                      <span className="font-semibold">{selectedBR.trit.quantiteHuile.toLocaleString()} L</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    {isFacon ? 'Prix unitaire (DT/kg)' : 'Prix de base (DT/L)'} *
                  </Label>
                  <Input
                    type="number"
                    value={formData.prixUnitaire}
                    onChange={(e) => setFormData({ ...formData, prixUnitaire: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mode de paiement *</Label>
                  <Select
                    value={formData.modePayment}
                    onValueChange={(value) => setFormData({ ...formData, modePayment: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentModes.map((mode) => (
                        <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date de paiement *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="p-4 rounded-lg bg-primary/10">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Montant total</span>
                    <span className="text-2xl font-semibold text-primary">
                      {montant.toFixed(2)} DT
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isFacon 
                      ? 'À recevoir du client' 
                      : 'À verser au client'
                    }
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setSelectedBR(null)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    Confirmer le paiement
                  </Button>
                </div>
              </form>
            );
          })()}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Paiements;
