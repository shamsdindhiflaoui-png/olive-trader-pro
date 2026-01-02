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
import { Invoice, BonReception, BonLivraison } from '@/types';
import { Plus, FileText, CreditCard, Clock, CheckCircle, AlertCircle, Download, Eye, Receipt, ShoppingCart, Pencil } from 'lucide-react';
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
    bonsReception,
    triturations,
    bonsLivraison,
    invoices,
    invoicePayments,
    settings,
    addInvoiceFromBR,
    addInvoiceFromBL,
    updateInvoice,
    addInvoicePayment,
  } = useAppStore();
  
  const [isInvoiceBRDialogOpen, setIsInvoiceBRDialogOpen] = useState(false);
  const [isInvoiceBLDialogOpen, setIsInvoiceBLDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedBR, setSelectedBR] = useState<BonReception | null>(null);
  const [selectedBL, setSelectedBL] = useState<BonLivraison | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  
  const [brInvoiceForm, setBrInvoiceForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    echeance: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    prixUnitaire: settings.defaultPrixFacon.toString(),
    tauxTVA: '19',
    droitTimbre: '1',
    observations: '',
  });
  
  const [blInvoiceForm, setBlInvoiceForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    echeance: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    observations: '',
  });
  
  const [paymentForm, setPaymentForm] = useState({
    montant: '',
    modePayment: 'especes',
    date: format(new Date(), 'yyyy-MM-dd'),
    reference: '',
    observations: '',
  });

  const [editForm, setEditForm] = useState({
    date: '',
    echeance: '',
    tauxTVA: '',
    droitTimbre: '',
    observations: '',
  });

  // Get BR Façon that are closed and not invoiced
  const pendingBRs = useMemo(() => {
    return bonsReception.filter(br => {
      if (br.status !== 'closed') return false;
      const client = clients.find(c => c.id === br.clientId);
      if (!client || client.transactionType !== 'facon') return false;
      const existingInvoice = invoices.find(i => i.source === 'br' && i.sourceId === br.id);
      return !existingInvoice;
    });
  }, [bonsReception, clients, invoices]);

  // Get BL not invoiced
  const pendingBLs = useMemo(() => {
    return bonsLivraison.filter(bl => !bl.invoiced);
  }, [bonsLivraison]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(i => i.status === filterStatus);
    }
    
    if (filterClient !== 'all') {
      filtered = filtered.filter(i => i.clientId === filterClient);
    }
    
    if (filterSource !== 'all') {
      filtered = filtered.filter(i => i.source === filterSource);
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
  }, [invoices, filterStatus, filterClient, filterSource, dateDebut, dateFin]);

  // Statistics
  const stats = useMemo(() => {
    const total = invoices.reduce((sum, i) => sum + i.montantTTC, 0);
    const paye = invoices.reduce((sum, i) => sum + i.montantPaye, 0);
    const enAttente = invoices.filter(i => i.status === 'en_attente').length;
    const enRetard = invoices.filter(i => i.status !== 'paye' && new Date(i.echeance) < new Date()).length;
    
    return { total, paye, enAttente, enRetard };
  }, [invoices]);

  const handleCreateInvoiceFromBR = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBR) {
      toast.error('Veuillez sélectionner un BR');
      return;
    }

    const invoice = addInvoiceFromBR({
      brId: selectedBR.id,
      date: new Date(brInvoiceForm.date),
      echeance: new Date(brInvoiceForm.echeance),
      prixUnitaire: Number(brInvoiceForm.prixUnitaire),
      tauxTVA: Number(brInvoiceForm.tauxTVA),
      droitTimbre: Number(brInvoiceForm.droitTimbre),
      observations: brInvoiceForm.observations || undefined,
    });

    if (invoice) {
      toast.success(`Facture ${invoice.number} créée avec succès`);
      setIsInvoiceBRDialogOpen(false);
      setSelectedBR(null);
      setBrInvoiceForm({
        date: format(new Date(), 'yyyy-MM-dd'),
        echeance: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        prixUnitaire: settings.defaultPrixFacon.toString(),
        tauxTVA: '19',
        droitTimbre: '1',
        observations: '',
      });
    } else {
      toast.error('Erreur lors de la création de la facture');
    }
  };

  const handleCreateInvoiceFromBL = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBL) {
      toast.error('Veuillez sélectionner un BL');
      return;
    }

    const invoice = addInvoiceFromBL({
      blId: selectedBL.id,
      date: new Date(blInvoiceForm.date),
      echeance: new Date(blInvoiceForm.echeance),
      observations: blInvoiceForm.observations || undefined,
    });

    if (invoice) {
      toast.success(`Facture ${invoice.number} créée avec succès`);
      setIsInvoiceBLDialogOpen(false);
      setSelectedBL(null);
      setBlInvoiceForm({
        date: format(new Date(), 'yyyy-MM-dd'),
        echeance: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        observations: '',
      });
    } else {
      toast.error('Erreur lors de la création de la facture');
    }
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

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({ ...paymentForm, montant: invoice.resteAPayer.toString() });
    setIsPaymentDialogOpen(true);
  };

  const openDetailDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailDialogOpen(true);
  };

  const openEditDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditForm({
      date: format(new Date(invoice.date), 'yyyy-MM-dd'),
      echeance: format(new Date(invoice.echeance), 'yyyy-MM-dd'),
      tauxTVA: invoice.tauxTVA.toString(),
      droitTimbre: invoice.droitTimbre.toString(),
      observations: invoice.observations || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInvoice) return;

    const success = updateInvoice(selectedInvoice.id, {
      date: new Date(editForm.date),
      echeance: new Date(editForm.echeance),
      tauxTVA: Number(editForm.tauxTVA),
      droitTimbre: Number(editForm.droitTimbre),
      observations: editForm.observations || undefined,
    });

    if (success) {
      toast.success('Facture modifiée avec succès');
      setIsEditDialogOpen(false);
    } else {
      toast.error('Erreur lors de la modification');
    }
  };

  const openBRInvoiceDialog = (br: BonReception) => {
    setSelectedBR(br);
    setBrInvoiceForm({
      ...brInvoiceForm,
      prixUnitaire: settings.defaultPrixFacon.toString(),
    });
    setIsInvoiceBRDialogOpen(true);
  };

  const openBLInvoiceDialog = (bl: BonLivraison) => {
    setSelectedBL(bl);
    setIsInvoiceBLDialogOpen(true);
  };

  const getInvoicePayments = (invoiceId: string) => {
    return invoicePayments.filter(p => p.invoiceId === invoiceId);
  };

  const calculateBRTotal = () => {
    if (!selectedBR) return { ht: 0, tva: 0, ttc: 0 };
    const ht = selectedBR.poidsNet * Number(brInvoiceForm.prixUnitaire);
    const tva = ht * (Number(brInvoiceForm.tauxTVA) / 100);
    const ttc = ht + tva + Number(brInvoiceForm.droitTimbre);
    return { ht, tva, ttc };
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
      key: 'source',
      header: 'Source',
      render: (i: Invoice) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${i.source === 'br' ? 'bg-primary/10 text-primary' : 'bg-info/10 text-info'}`}>
          {i.source === 'br' ? 'Service (BR)' : 'Vente (BL)'}
        </span>
      ),
    },
    {
      key: 'sourceNumber',
      header: 'Réf. Source',
      render: (i: Invoice) => i.sourceNumber || '-',
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
      key: 'reste',
      header: 'Reste',
      render: (i: Invoice) => (
        <span className={i.resteAPayer > 0 ? 'text-warning font-medium' : 'text-success'}>
          {i.resteAPayer.toFixed(3)} DT
        </span>
      ),
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
            <Button variant="ghost" size="sm" onClick={() => openEditDialog(i)}>
              <Pencil className="h-4 w-4" />
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

  const brTotals = calculateBRTotal();

  return (
    <MainLayout>
      <PageHeader 
        title="Gestion des Factures" 
        description="Créez des factures à partir des BR (service) ou BL (vente) et suivez les paiements"
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
          <TabsTrigger value="a-facturer-br" className="gap-2">
            <Receipt className="h-4 w-4" />
            BR à facturer ({pendingBRs.length})
          </TabsTrigger>
          <TabsTrigger value="a-facturer-bl" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            BL à facturer ({pendingBLs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="liste" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-6">
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
                  <Label>Source</Label>
                  <Select value={filterSource} onValueChange={setFilterSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les sources</SelectItem>
                      <SelectItem value="br">Service (BR)</SelectItem>
                      <SelectItem value="bl">Vente (BL)</SelectItem>
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
                    onClick={() => { setFilterClient('all'); setFilterSource('all'); setFilterStatus('all'); setDateDebut(''); setDateFin(''); }}
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
            emptyMessage="Aucune facture. Créez des factures à partir des BR ou BL."
          />
        </TabsContent>

        <TabsContent value="a-facturer-br" className="space-y-4">
          {pendingBRs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <Receipt className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Aucun BR à facturer</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Les BR de type Façon fermés et non encore facturés apparaissent ici.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingBRs.map((br) => {
                const client = clients.find(c => c.id === br.clientId);
                const trit = triturations.find(t => t.brId === br.id);
                return (
                  <Card key={br.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-serif text-lg">{br.number}</CardTitle>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          Façon
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Client: </span>
                        <span className="font-medium">{client?.name}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Poids net: </span>
                        <span className="font-medium">{br.poidsNet.toLocaleString()} kg</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Date: </span>
                        <span className="font-medium">{format(new Date(br.date), 'dd/MM/yyyy', { locale: fr })}</span>
                      </div>
                      {trit && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Huile: </span>
                          <span className="font-medium">{trit.quantiteHuile.toLocaleString()} L</span>
                        </div>
                      )}
                      <Button className="w-full mt-2" onClick={() => openBRInvoiceDialog(br)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Créer la facture
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="a-facturer-bl" className="space-y-4">
          {pendingBLs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <ShoppingCart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Aucun BL à facturer</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Les bons de livraison non encore facturés apparaissent ici.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingBLs.map((bl) => {
                const client = clients.find(c => c.id === bl.clientId);
                return (
                  <Card key={bl.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-serif text-lg">{bl.number}</CardTitle>
                        <span className="text-xs px-2 py-1 rounded-full bg-info/10 text-info">
                          Vente
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Client: </span>
                        <span className="font-medium">{client?.name}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Quantité: </span>
                        <span className="font-medium">{bl.quantite.toLocaleString()} L</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Montant TTC: </span>
                        <span className="font-semibold text-primary">{bl.montantTTC.toFixed(3)} DT</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Date: </span>
                        <span className="font-medium">{format(new Date(bl.date), 'dd/MM/yyyy', { locale: fr })}</span>
                      </div>
                      <Button className="w-full mt-2" onClick={() => openBLInvoiceDialog(bl)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Créer la facture
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Invoice from BR Dialog */}
      <Dialog open={isInvoiceBRDialogOpen} onOpenChange={setIsInvoiceBRDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Facturer le service de trituration</DialogTitle>
          </DialogHeader>
          {selectedBR && (
            <form onSubmit={handleCreateInvoiceFromBR} className="space-y-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">BR</span>
                  <span className="font-medium">{selectedBR.number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{clients.find(c => c.id === selectedBR.clientId)?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Poids net</span>
                  <span className="font-semibold text-primary">{selectedBR.poidsNet.toLocaleString()} kg</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date facture *</Label>
                  <Input
                    type="date"
                    value={brInvoiceForm.date}
                    onChange={(e) => setBrInvoiceForm({ ...brInvoiceForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Échéance *</Label>
                  <Input
                    type="date"
                    value={brInvoiceForm.echeance}
                    onChange={(e) => setBrInvoiceForm({ ...brInvoiceForm, echeance: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prix unitaire (DT/kg) *</Label>
                <Input
                  type="number"
                  value={brInvoiceForm.prixUnitaire}
                  onChange={(e) => setBrInvoiceForm({ ...brInvoiceForm, prixUnitaire: e.target.value })}
                  step="0.001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Taux TVA (%)</Label>
                  <Input
                    type="number"
                    value={brInvoiceForm.tauxTVA}
                    onChange={(e) => setBrInvoiceForm({ ...brInvoiceForm, tauxTVA: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Droit de Timbre (DT)</Label>
                  <Input
                    type="number"
                    value={brInvoiceForm.droitTimbre}
                    onChange={(e) => setBrInvoiceForm({ ...brInvoiceForm, droitTimbre: e.target.value })}
                    step="0.001"
                  />
                </div>
              </div>

              {/* Totals Preview */}
              <div className="p-4 rounded-lg bg-success/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total HT:</span>
                  <span className="font-medium">{brTotals.ht.toFixed(3)} DT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA ({brInvoiceForm.tauxTVA}%):</span>
                  <span className="font-medium">{brTotals.tva.toFixed(3)} DT</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total TTC:</span>
                  <span className="text-primary">{brTotals.ttc.toFixed(3)} DT</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observations</Label>
                <Textarea
                  value={brInvoiceForm.observations}
                  onChange={(e) => setBrInvoiceForm({ ...brInvoiceForm, observations: e.target.value })}
                  placeholder="Notes..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsInvoiceBRDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Créer la facture</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Invoice from BL Dialog */}
      <Dialog open={isInvoiceBLDialogOpen} onOpenChange={setIsInvoiceBLDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Facturer la vente d'huile</DialogTitle>
          </DialogHeader>
          {selectedBL && (
            <form onSubmit={handleCreateInvoiceFromBL} className="space-y-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">BL</span>
                  <span className="font-medium">{selectedBL.number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{clients.find(c => c.id === selectedBL.clientId)?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantité</span>
                  <span className="font-medium">{selectedBL.quantite.toLocaleString()} L</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prix unitaire</span>
                  <span className="font-medium">{selectedBL.prixUnitaire.toFixed(3)} DT/L</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-success/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total HT:</span>
                  <span className="font-medium">{selectedBL.montantHT.toFixed(3)} DT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA ({selectedBL.tauxTVA}%):</span>
                  <span className="font-medium">{selectedBL.montantTVA.toFixed(3)} DT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Droit de Timbre:</span>
                  <span className="font-medium">{selectedBL.droitTimbre.toFixed(3)} DT</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total TTC:</span>
                  <span className="text-primary">{selectedBL.montantTTC.toFixed(3)} DT</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date facture *</Label>
                  <Input
                    type="date"
                    value={blInvoiceForm.date}
                    onChange={(e) => setBlInvoiceForm({ ...blInvoiceForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Échéance *</Label>
                  <Input
                    type="date"
                    value={blInvoiceForm.echeance}
                    onChange={(e) => setBlInvoiceForm({ ...blInvoiceForm, echeance: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observations</Label>
                <Textarea
                  value={blInvoiceForm.observations}
                  onChange={(e) => setBlInvoiceForm({ ...blInvoiceForm, observations: e.target.value })}
                  placeholder="Notes..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsInvoiceBLDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Créer la facture</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="font-medium">
                    {selectedInvoice.source === 'br' ? 'Service (BR)' : 'Vente (BL)'} - {selectedInvoice.sourceNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date / Échéance</p>
                  <p className="font-medium">
                    {format(new Date(selectedInvoice.date), 'dd/MM/yyyy', { locale: fr })} / {format(new Date(selectedInvoice.echeance), 'dd/MM/yyyy', { locale: fr })}
                  </p>
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

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Modifier la facture</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <form onSubmit={handleUpdateInvoice} className="space-y-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">N° Facture</span>
                  <span className="font-medium">{selectedInvoice.number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{clients.find(c => c.id === selectedInvoice.clientId)?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Montant HT</span>
                  <span className="font-semibold text-primary">{selectedInvoice.montantHT.toFixed(3)} DT</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date facture *</Label>
                  <Input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Échéance *</Label>
                  <Input
                    type="date"
                    value={editForm.echeance}
                    onChange={(e) => setEditForm({ ...editForm, echeance: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Taux TVA (%)</Label>
                  <Input
                    type="number"
                    value={editForm.tauxTVA}
                    onChange={(e) => setEditForm({ ...editForm, tauxTVA: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Droit de Timbre (DT)</Label>
                  <Input
                    type="number"
                    value={editForm.droitTimbre}
                    onChange={(e) => setEditForm({ ...editForm, droitTimbre: e.target.value })}
                    step="0.001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observations</Label>
                <Textarea
                  value={editForm.observations}
                  onChange={(e) => setEditForm({ ...editForm, observations: e.target.value })}
                  placeholder="Remarques ou notes sur la facture..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  <Pencil className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Factures;
