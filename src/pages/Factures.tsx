import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
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
import { Invoice, InvoicePayment, InvoiceLine } from '@/types';
import { Plus, FileText, CreditCard, Clock, CheckCircle, AlertCircle, Trash2, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format, isWithinInterval, startOfDay, endOfDay, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/pdf/InvoicePDF';

const statusLabels = {
  en_attente: 'En attente',
  partiellement_paye: 'Partiel',
  paye: 'Payé',
};

const statusColors = {
  en_attente: 'bg-warning/10 text-warning',
  partiellement_paye: 'bg-info/10 text-info',
  paye: 'bg-success/10 text-success',
};

const Factures = () => {
  const { 
    clients, 
    invoices,
    invoicePayments,
    settings,
    addInvoice,
    addInvoicePayment,
  } = useAppStore();
  
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    echeance: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    tauxTVA: '19',
    droitTimbre: '1',
    observations: '',
  });
  
  const [lignes, setLignes] = useState<{ description: string; quantite: string; prixUnitaire: string }[]>([
    { description: '', quantite: '', prixUnitaire: '' }
  ]);
  
  const [paymentForm, setPaymentForm] = useState({
    montant: '',
    modePayment: 'especes',
    date: format(new Date(), 'yyyy-MM-dd'),
    reference: '',
    observations: '',
  });

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(i => i.status === filterStatus);
    }
    
    if (filterClient !== 'all') {
      filtered = filtered.filter(i => i.clientId === filterClient);
    }
    
    if (dateDebut && dateFin) {
      filtered = filtered.filter(i => {
        const invoiceDate = new Date(i.date);
        return isWithinInterval(invoiceDate, {
          start: startOfDay(new Date(dateDebut)),
          end: endOfDay(new Date(dateFin)),
        });
      });
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, filterStatus, filterClient, dateDebut, dateFin]);

  // Statistics
  const stats = useMemo(() => {
    const total = invoices.reduce((sum, i) => sum + i.montantTTC, 0);
    const paye = invoices.reduce((sum, i) => sum + i.montantPaye, 0);
    const enAttente = invoices.filter(i => i.status === 'en_attente').length;
    const enRetard = invoices.filter(i => i.status !== 'paye' && new Date(i.echeance) < new Date()).length;
    
    return { total, paye, enAttente, enRetard };
  }, [invoices]);

  const addLigne = () => {
    setLignes([...lignes, { description: '', quantite: '', prixUnitaire: '' }]);
  };

  const removeLigne = (index: number) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((_, i) => i !== index));
    }
  };

  const updateLigne = (index: number, field: string, value: string) => {
    setLignes(lignes.map((l, i) => i === index ? { ...l, [field]: value } : l));
  };

  const calculateTotal = () => {
    const ht = lignes.reduce((sum, l) => {
      const qty = Number(l.quantite) || 0;
      const price = Number(l.prixUnitaire) || 0;
      return sum + (qty * price);
    }, 0);
    const tva = ht * (Number(invoiceForm.tauxTVA) / 100);
    const ttc = ht + tva + Number(invoiceForm.droitTimbre);
    return { ht, tva, ttc };
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoiceForm.clientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }
    
    const validLignes = lignes.filter(l => l.description && l.quantite && l.prixUnitaire);
    if (validLignes.length === 0) {
      toast.error('Veuillez ajouter au moins une ligne');
      return;
    }

    const invoice = addInvoice({
      clientId: invoiceForm.clientId,
      date: new Date(invoiceForm.date),
      echeance: new Date(invoiceForm.echeance),
      lignes: validLignes.map(l => ({
        description: l.description,
        quantite: Number(l.quantite),
        prixUnitaire: Number(l.prixUnitaire),
        montant: Number(l.quantite) * Number(l.prixUnitaire),
      })),
      tauxTVA: Number(invoiceForm.tauxTVA),
      droitTimbre: Number(invoiceForm.droitTimbre),
      observations: invoiceForm.observations || undefined,
    });

    toast.success(`Facture ${invoice.number} créée avec succès`);
    setIsInvoiceDialogOpen(false);
    resetInvoiceForm();
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInvoice || !paymentForm.montant || !paymentForm.modePayment) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const success = addInvoicePayment({
      invoiceId: selectedInvoice.id,
      montant: Number(paymentForm.montant),
      modePayment: paymentForm.modePayment,
      date: new Date(paymentForm.date),
      reference: paymentForm.reference || undefined,
      observations: paymentForm.observations || undefined,
    });

    if (success) {
      toast.success('Paiement enregistré avec succès');
      setIsPaymentDialogOpen(false);
      setPaymentForm({
        montant: '',
        modePayment: 'especes',
        date: format(new Date(), 'yyyy-MM-dd'),
        reference: '',
        observations: '',
      });
    } else {
      toast.error('Montant supérieur au reste à payer');
    }
  };

  const resetInvoiceForm = () => {
    setInvoiceForm({
      clientId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      echeance: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      tauxTVA: '19',
      droitTimbre: '1',
      observations: '',
    });
    setLignes([{ description: '', quantite: '', prixUnitaire: '' }]);
  };

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({ ...paymentForm, montant: invoice.resteAPayer.toString() });
    setIsPaymentDialogOpen(true);
  };

  const openDetailDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailDialogOpen(true);
  };

  const getInvoicePayments = (invoiceId: string) => {
    return invoicePayments.filter(p => p.invoiceId === invoiceId);
  };

  const invoiceColumns = [
    {
      key: 'number',
      header: 'N° Facture',
      render: (i: Invoice) => <span className="font-medium text-primary">{i.number}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (i: Invoice) => format(new Date(i.date), 'dd/MM/yyyy', { locale: fr }),
    },
    {
      key: 'client',
      header: 'Client',
      render: (i: Invoice) => {
        const client = clients.find(c => c.id === i.clientId);
        return client?.name || '-';
      },
    },
    {
      key: 'montantTTC',
      header: 'Montant TTC',
      render: (i: Invoice) => <span className="font-semibold">{i.montantTTC.toFixed(3)} DT</span>,
    },
    {
      key: 'paye',
      header: 'Payé',
      render: (i: Invoice) => <span className="text-success">{i.montantPaye.toFixed(3)} DT</span>,
    },
    {
      key: 'reste',
      header: 'Reste',
      render: (i: Invoice) => (
        <span className={i.resteAPayer > 0 ? 'text-warning font-medium' : 'text-success'}>
          {i.resteAPayer.toFixed(3)} DT
        </span>
      ),
    },
    {
      key: 'echeance',
      header: 'Échéance',
      render: (i: Invoice) => {
        const isOverdue = i.status !== 'paye' && new Date(i.echeance) < new Date();
        return (
          <span className={isOverdue ? 'text-destructive font-medium' : ''}>
            {format(new Date(i.echeance), 'dd/MM/yyyy', { locale: fr })}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Statut',
      render: (i: Invoice) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[i.status]}`}>
          {statusLabels[i.status]}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (i: Invoice) => {
        const client = clients.find(c => c.id === i.clientId);
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => openDetailDialog(i)}>
              <Eye className="h-4 w-4" />
            </Button>
            {i.status !== 'paye' && (
              <Button variant="ghost" size="sm" onClick={() => openPaymentDialog(i)}>
                <CreditCard className="h-4 w-4" />
              </Button>
            )}
            {client && (
              <PDFDownloadLink
                document={<InvoicePDF invoice={i} client={client} settings={settings} />}
                fileName={`${i.number}.pdf`}
              >
                {({ loading }) => (
                  <Button variant="ghost" size="sm" disabled={loading}>
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </PDFDownloadLink>
            )}
          </div>
        );
      },
    },
  ];

  const totals = calculateTotal();

  return (
    <MainLayout>
      <PageHeader 
        title="Gestion des Factures" 
        description="Créez et suivez les factures clients"
        action={
          <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Facture
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif">Créer une facture</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Client *</Label>
                    <Select
                      value={invoiceForm.clientId}
                      onValueChange={(value) => setInvoiceForm({ ...invoiceForm, clientId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={invoiceForm.date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Échéance *</Label>
                    <Input
                      type="date"
                      value={invoiceForm.echeance}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, echeance: e.target.value })}
                    />
                  </div>
                </div>

                {/* Lines */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Lignes de facturation</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLigne}>
                      <Plus className="h-4 w-4 mr-1" /> Ajouter
                    </Button>
                  </div>
                  {lignes.map((ligne, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        placeholder="Description"
                        value={ligne.description}
                        onChange={(e) => updateLigne(index, 'description', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Qté"
                        value={ligne.quantite}
                        onChange={(e) => updateLigne(index, 'quantite', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        type="number"
                        placeholder="Prix"
                        value={ligne.prixUnitaire}
                        onChange={(e) => updateLigne(index, 'prixUnitaire', e.target.value)}
                        className="w-28"
                        step="0.001"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLigne(index)}
                        disabled={lignes.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Taux TVA (%)</Label>
                    <Input
                      type="number"
                      value={invoiceForm.tauxTVA}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, tauxTVA: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Droit de Timbre (DT)</Label>
                    <Input
                      type="number"
                      value={invoiceForm.droitTimbre}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, droitTimbre: e.target.value })}
                      step="0.001"
                    />
                  </div>
                </div>

                {/* Totals Preview */}
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total HT:</span>
                    <span className="font-medium">{totals.ht.toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TVA ({invoiceForm.tauxTVA}%):</span>
                    <span className="font-medium">{totals.tva.toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total TTC:</span>
                    <span className="text-primary">{totals.ttc.toFixed(3)} DT</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observations</Label>
                  <Textarea
                    value={invoiceForm.observations}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, observations: e.target.value })}
                    placeholder="Notes..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsInvoiceDialogOpen(false); resetInvoiceForm(); }}>
                    Annuler
                  </Button>
                  <Button type="submit">Créer la facture</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="Total Facturé"
          value={`${stats.total.toFixed(3)} DT`}
          subtitle={`${invoices.length} factures`}
          icon={FileText}
        />
        <StatCard
          title="Total Encaissé"
          value={`${stats.paye.toFixed(3)} DT`}
          subtitle="Paiements reçus"
          icon={CheckCircle}
        />
        <StatCard
          title="En Attente"
          value={stats.enAttente.toString()}
          subtitle="Factures non payées"
          icon={Clock}
        />
        <StatCard
          title="En Retard"
          value={stats.enRetard.toString()}
          subtitle="Échéance dépassée"
          icon={AlertCircle}
        />
      </div>

      <Tabs defaultValue="liste" className="space-y-6">
        <TabsList>
          <TabsTrigger value="liste" className="gap-2">
            <FileText className="h-4 w-4" />
            Liste des factures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="liste" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-5">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={filterClient} onValueChange={setFilterClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les clients</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="en_attente">En attente</SelectItem>
                      <SelectItem value="partiellement_paye">Partiellement payé</SelectItem>
                      <SelectItem value="paye">Payé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date début</Label>
                  <Input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date fin</Label>
                  <Input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => { setFilterClient('all'); setFilterStatus('all'); setDateDebut(''); setDateFin(''); }}
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <DataTable
            columns={invoiceColumns}
            data={filteredInvoices}
            emptyMessage="Aucune facture. Créez votre première facture pour commencer."
          />
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Enregistrer un paiement</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Facture</span>
                  <span className="font-medium">{selectedInvoice.number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Montant TTC</span>
                  <span className="font-medium">{selectedInvoice.montantTTC.toFixed(3)} DT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reste à payer</span>
                  <span className="font-semibold text-warning">{selectedInvoice.resteAPayer.toFixed(3)} DT</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Montant du paiement (DT) *</Label>
                <Input
                  type="number"
                  value={paymentForm.montant}
                  onChange={(e) => setPaymentForm({ ...paymentForm, montant: e.target.value })}
                  step="0.001"
                  max={selectedInvoice.resteAPayer}
                />
              </div>

              <div className="space-y-2">
                <Label>Mode de paiement *</Label>
                <Select
                  value={paymentForm.modePayment}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, modePayment: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="especes">Espèces</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                    <SelectItem value="virement">Virement</SelectItem>
                    <SelectItem value="carte">Carte bancaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Référence (chèque, virement...)</Label>
                <Input
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="N° de chèque, référence virement..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Détails de la facture</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">N° Facture</p>
                  <p className="font-semibold text-lg">{selectedInvoice.number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{clients.find(c => c.id === selectedInvoice.clientId)?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedInvoice.date), 'dd MMMM yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Échéance</p>
                  <p className="font-medium">{format(new Date(selectedInvoice.echeance), 'dd MMMM yyyy', { locale: fr })}</p>
                </div>
              </div>

              {/* Lines */}
              <div>
                <h4 className="font-medium mb-2">Lignes</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Description</th>
                        <th className="text-center p-2">Qté</th>
                        <th className="text-right p-2">Prix Unit.</th>
                        <th className="text-right p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.lignes.map((ligne) => (
                        <tr key={ligne.id} className="border-t">
                          <td className="p-2">{ligne.description}</td>
                          <td className="text-center p-2">{ligne.quantite}</td>
                          <td className="text-right p-2">{ligne.prixUnitaire.toFixed(3)} DT</td>
                          <td className="text-right p-2 font-medium">{ligne.montant.toFixed(3)} DT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total HT:</span>
                  <span className="font-medium">{selectedInvoice.montantHT.toFixed(3)} DT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA ({selectedInvoice.tauxTVA}%):</span>
                  <span className="font-medium">{selectedInvoice.montantTVA.toFixed(3)} DT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Droit de Timbre:</span>
                  <span className="font-medium">{selectedInvoice.droitTimbre.toFixed(3)} DT</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total TTC:</span>
                  <span className="text-primary">{selectedInvoice.montantTTC.toFixed(3)} DT</span>
                </div>
              </div>

              {/* Payments History */}
              <div>
                <h4 className="font-medium mb-2">Historique des paiements</h4>
                {getInvoicePayments(selectedInvoice.id).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun paiement enregistré</p>
                ) : (
                  <div className="space-y-2">
                    {getInvoicePayments(selectedInvoice.id).map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                        <div>
                          <p className="font-medium text-success">{p.montant.toFixed(3)} DT</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(p.date), 'dd/MM/yyyy', { locale: fr })} - {p.modePayment}
                            {p.reference && ` (${p.reference})`}
                          </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-success" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              <div className="p-4 rounded-lg bg-warning/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Montant payé:</span>
                  <span className="font-medium text-success">{selectedInvoice.montantPaye.toFixed(3)} DT</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Reste à payer:</span>
                  <span className={selectedInvoice.resteAPayer > 0 ? 'text-warning' : 'text-success'}>
                    {selectedInvoice.resteAPayer.toFixed(3)} DT
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                {selectedInvoice.status !== 'paye' && (
                  <Button onClick={() => { setIsDetailDialogOpen(false); openPaymentDialog(selectedInvoice); }}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Ajouter un paiement
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Factures;
