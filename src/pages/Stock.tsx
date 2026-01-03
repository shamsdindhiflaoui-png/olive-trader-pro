import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
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
import { Reservoir, BonReception, Trituration, StockMovement } from '@/types';
import { Plus, Database, Droplets, ArrowRightLeft, ShoppingCart, History, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BonLivraisonPDF } from '@/components/pdf/BonLivraisonPDF';

const transactionTypeLabels = {
  facon: 'Façon (Service) | خدمة',
  bawaza: 'Bawaza | باوازا',
  achat_base: 'Achat à la base | شراء من المصدر',
};

const movementTypeLabels = {
  entree: 'Entrée | دخول',
  sortie_vente: 'Vente | بيع',
  transfert_in: 'Transfert entrant | تحويل وارد',
  transfert_out: 'Transfert sortant | تحويل صادر',
};

const Stock = () => {
  const { 
    clients, 
    bonsReception, 
    triturations, 
    reservoirs, 
    stockAffectations,
    stockMovements,
    bonsLivraison,
    settings,
    addReservoir, 
    affectToReservoir,
    transferBetweenReservoirs,
    addSale,
  } = useAppStore();
  
  const [isReservoirDialogOpen, setIsReservoirDialogOpen] = useState(false);
  const [isAffectDialogOpen, setIsAffectDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [selectedTrit, setSelectedTrit] = useState<{ br: BonReception; trit: Trituration } | null>(null);
  const [selectedReservoir, setSelectedReservoir] = useState<string>('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [lastCreatedBL, setLastCreatedBL] = useState<any>(null);
  
  const [reservoirForm, setReservoirForm] = useState({
    code: '',
    capaciteMax: '',
    observations: '',
  });
  const [affectForm, setAffectForm] = useState({
    reservoirId: '',
    quantite: '',
  });
  const [transferForm, setTransferForm] = useState({
    fromReservoirId: '',
    toReservoirId: '',
    quantite: '',
  });
  const [saleForm, setSaleForm] = useState({
    clientId: '',
    reservoirId: '',
    quantite: '',
    prixUnitaire: '',
    tauxTVA: '19',
    droitTimbre: '1',
    date: format(new Date(), 'yyyy-MM-dd'),
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
      if (client.transactionType === 'facon') return false;
      
      const affectations = stockAffectations.filter(a => a.brId === br.id);
      const totalAffected = affectations.reduce((sum, a) => sum + a.quantite, 0);
      const trit = tritsByBR[br.id];
      if (!trit) return false;
      
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

  // Filter movements
  const filteredMovements = useMemo(() => {
    let filtered = [...stockMovements];
    
    if (selectedReservoir !== 'all') {
      filtered = filtered.filter(m => m.reservoirId === selectedReservoir);
    }
    
    if (dateDebut && dateFin) {
      filtered = filtered.filter(m => {
        const moveDate = new Date(m.date);
        return isWithinInterval(moveDate, {
          start: startOfDay(new Date(dateDebut)),
          end: endOfDay(new Date(dateFin)),
        });
      });
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [stockMovements, selectedReservoir, dateDebut, dateFin]);

  // Statistics
  const stats = useMemo(() => {
    const totalStock = reservoirs.reduce((sum, r) => sum + r.quantiteActuelle, 0);
    const totalCapacity = reservoirs.reduce((sum, r) => sum + r.capaciteMax, 0);
    const totalSales = filteredMovements
      .filter(m => m.type === 'sortie_vente')
      .reduce((sum, m) => sum + m.quantite, 0);
    const totalEntries = filteredMovements
      .filter(m => m.type === 'entree')
      .reduce((sum, m) => sum + m.quantite, 0);
    
    return { totalStock, totalCapacity, totalSales, totalEntries };
  }, [reservoirs, filteredMovements]);

  const handleAddReservoir = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reservoirForm.code || !reservoirForm.capaciteMax) {
      toast.error('Le code et la capacité sont obligatoires | الرمز والسعة إجباريان');
      return;
    }

    addReservoir({
      code: reservoirForm.code,
      capaciteMax: Number(reservoirForm.capaciteMax),
      quantiteActuelle: 0,
      status: 'disponible',
      observations: reservoirForm.observations || undefined,
    });

    toast.success('Réservoir ajouté avec succès | تمت إضافة الخزان بنجاح');
    setIsReservoirDialogOpen(false);
    setReservoirForm({ code: '', capaciteMax: '', observations: '' });
  };

  const handleAffect = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTrit || !affectForm.reservoirId || !affectForm.quantite) {
      toast.error('Veuillez remplir tous les champs | يرجى ملء جميع الحقول');
      return;
    }

    const quantity = Number(affectForm.quantite);
    const success = affectToReservoir(affectForm.reservoirId, quantity, selectedTrit.br.id);

    if (success) {
      toast.success('Huile affectée au réservoir avec succès | تم تخصيص الزيت للخزان بنجاح');
      setIsAffectDialogOpen(false);
      setSelectedTrit(null);
      setAffectForm({ reservoirId: '', quantite: '' });
    } else {
      toast.error('Capacité du réservoir insuffisante | سعة الخزان غير كافية');
    }
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferForm.fromReservoirId || !transferForm.toReservoirId || !transferForm.quantite) {
      toast.error('Veuillez remplir tous les champs | يرجى ملء جميع الحقول');
      return;
    }
    
    if (transferForm.fromReservoirId === transferForm.toReservoirId) {
      toast.error('Les réservoirs source et destination doivent être différents | يجب أن يكون الخزانان مختلفين');
      return;
    }

    const success = transferBetweenReservoirs(
      transferForm.fromReservoirId,
      transferForm.toReservoirId,
      Number(transferForm.quantite)
    );

    if (success) {
      toast.success('Transfert effectué avec succès | تم التحويل بنجاح');
      setIsTransferDialogOpen(false);
      setTransferForm({ fromReservoirId: '', toReservoirId: '', quantite: '' });
    } else {
      toast.error('Transfert impossible (quantité insuffisante ou capacité dépassée) | التحويل مستحيل');
    }
  };

  const handleSale = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!saleForm.clientId || !saleForm.reservoirId || !saleForm.quantite || !saleForm.prixUnitaire) {
      toast.error('Veuillez remplir tous les champs obligatoires | يرجى ملء جميع الحقول الإجبارية');
      return;
    }

    const bl = addSale({
      clientId: saleForm.clientId,
      reservoirId: saleForm.reservoirId,
      quantite: Number(saleForm.quantite),
      prixUnitaire: Number(saleForm.prixUnitaire),
      tauxTVA: Number(saleForm.tauxTVA),
      droitTimbre: Number(saleForm.droitTimbre),
      date: new Date(saleForm.date),
    });

    if (bl) {
      const client = clients.find(c => c.id === saleForm.clientId);
      setLastCreatedBL({ bl, client });
      toast.success(`Vente enregistrée - ${bl.number} | تم تسجيل البيع`);
      setSaleForm({
        clientId: '',
        reservoirId: '',
        quantite: '',
        prixUnitaire: '',
        tauxTVA: '19',
        droitTimbre: '1',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    } else {
      toast.error('Vente impossible (quantité insuffisante dans le réservoir) | البيع مستحيل');
    }
  };

  const openAffectDialog = (br: BonReception, trit: Trituration) => {
    setSelectedTrit({ br, trit });
    setIsAffectDialogOpen(true);
  };

  const reservoirColumns = [
    { 
      key: 'code', 
      header: 'Code | الرمز',
      render: (r: Reservoir) => <span className="font-medium text-primary">{r.code}</span>
    },
    { 
      key: 'capaciteMax', 
      header: 'Capacité Max | السعة القصوى',
      render: (r: Reservoir) => `${r.capaciteMax.toLocaleString()} L`
    },
    { 
      key: 'quantiteActuelle', 
      header: 'Quantité Actuelle | الكمية الحالية',
      render: (r: Reservoir) => `${r.quantiteActuelle.toLocaleString()} L`
    },
    { 
      key: 'fill', 
      header: 'Remplissage | الامتلاء',
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
      header: 'Statut | الحالة',
      render: (r: Reservoir) => <StatusBadge status={r.status} />
    },
  ];

  const movementColumns = [
    {
      key: 'date',
      header: 'Date | التاريخ',
      render: (m: StockMovement) => format(new Date(m.date), 'dd/MM/yyyy HH:mm', { locale: fr }),
    },
    {
      key: 'reservoir',
      header: 'Réservoir | الخزان',
      render: (m: StockMovement) => {
        const res = reservoirs.find(r => r.id === m.reservoirId);
        return <span className="font-medium">{res?.code || '-'}</span>;
      },
    },
    {
      key: 'type',
      header: 'Type | النوع',
      render: (m: StockMovement) => {
        const colors: Record<string, string> = {
          entree: 'bg-success/10 text-success',
          sortie_vente: 'bg-warning/10 text-warning',
          transfert_in: 'bg-info/10 text-info',
          transfert_out: 'bg-muted text-muted-foreground',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[m.type]}`}>
            {movementTypeLabels[m.type]}
          </span>
        );
      },
    },
    {
      key: 'quantite',
      header: 'Quantité | الكمية',
      render: (m: StockMovement) => {
        const isPositive = m.type === 'entree' || m.type === 'transfert_in';
        return (
          <span className={isPositive ? 'text-success font-medium' : 'text-warning font-medium'}>
            {isPositive ? '+' : '-'}{m.quantite.toLocaleString()} L
          </span>
        );
      },
    },
    {
      key: 'reference',
      header: 'Référence | المرجع',
      render: (m: StockMovement) => {
        if (m.type === 'sortie_vente' && m.clientId) {
          const client = clients.find(c => c.id === m.clientId);
          return (
            <div>
              <span className="font-medium">{m.reference}</span>
              {client && <span className="text-xs text-muted-foreground block">{client.name}</span>}
            </div>
          );
        }
        if ((m.type === 'transfert_in' || m.type === 'transfert_out') && m.linkedReservoirId) {
          const linkedRes = reservoirs.find(r => r.id === m.linkedReservoirId);
          return (
            <div>
              <span className="font-medium">{m.reference}</span>
              <span className="text-xs text-muted-foreground block">
                {m.type === 'transfert_in' ? 'De | من: ' : 'Vers | إلى: '}{linkedRes?.code}
              </span>
            </div>
          );
        }
        return m.reference || '-';
      },
    },
  ];

  return (
    <MainLayout>
      <PageHeader 
        title="Gestion du Stock | إدارة المخزون" 
        description="Gérez vos réservoirs, transferts et ventes d'huile | إدارة الخزانات والتحويلات والمبيعات"
        action={
          <div className="flex gap-2">
            <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Transfert | تحويل
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif">Transfert entre réservoirs | التحويل بين الخزانات</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Réservoir source * | الخزان المصدر *</Label>
                    <Select
                      value={transferForm.fromReservoirId}
                      onValueChange={(value) => setTransferForm({ ...transferForm, fromReservoirId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner... | اختر..." />
                      </SelectTrigger>
                      <SelectContent>
                        {reservoirs.filter(r => r.quantiteActuelle > 0).map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.code} - {r.quantiteActuelle.toLocaleString()} L disponibles | متاح
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Réservoir destination * | الخزان الوجهة *</Label>
                    <Select
                      value={transferForm.toReservoirId}
                      onValueChange={(value) => setTransferForm({ ...transferForm, toReservoirId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner... | اختر..." />
                      </SelectTrigger>
                      <SelectContent>
                        {reservoirs.filter(r => r.status !== 'plein').map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.code} - Libre | فارغ: {(r.capaciteMax - r.quantiteActuelle).toLocaleString()} L
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantité à transférer (L) * | الكمية للتحويل *</Label>
                    <Input
                      type="number"
                      value={transferForm.quantite}
                      onChange={(e) => setTransferForm({ ...transferForm, quantite: e.target.value })}
                      placeholder="0"
                      step="0.1"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
                      Annuler | إلغاء
                    </Button>
                    <Button type="submit">Transférer | تحويل</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isSaleDialogOpen} onOpenChange={(open) => { setIsSaleDialogOpen(open); if (!open) setLastCreatedBL(null); }}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Vente | بيع
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-serif">Nouvelle vente d'huile | بيع زيت جديد</DialogTitle>
                </DialogHeader>
                {lastCreatedBL ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-success/10 text-center">
                      <FileText className="h-12 w-12 mx-auto text-success mb-2" />
                      <p className="font-semibold text-lg">{lastCreatedBL.bl.number}</p>
                      <p className="text-sm text-muted-foreground">Bon de livraison créé avec succès | تم إنشاء وصل التسليم</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Client | الحريف:</span>
                        <p className="font-medium">{lastCreatedBL.client?.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantité | الكمية:</span>
                        <p className="font-medium">{lastCreatedBL.bl.quantite.toLocaleString()} L</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Montant HT | المبلغ خام:</span>
                        <p className="font-medium">{lastCreatedBL.bl.montantHT.toFixed(3)} DT</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total TTC | المجموع:</span>
                        <p className="font-semibold text-primary">{lastCreatedBL.bl.montantTTC.toFixed(3)} DT</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <PDFDownloadLink
                        document={<BonLivraisonPDF bl={lastCreatedBL.bl} client={lastCreatedBL.client} settings={settings} />}
                        fileName={`${lastCreatedBL.bl.number}.pdf`}
                        className="flex-1"
                      >
                        {({ loading }) => (
                          <Button className="w-full" disabled={loading}>
                            <Download className="mr-2 h-4 w-4" />
                            {loading ? 'Préparation... | جاري التحميل...' : 'Télécharger PDF | تحميل PDF'}
                          </Button>
                        )}
                      </PDFDownloadLink>
                      <Button variant="outline" onClick={() => { setLastCreatedBL(null); }}>
                        Nouvelle vente | بيع جديد
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSale} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label>Client * | الحريف *</Label>
                        <Select
                          value={saleForm.clientId}
                          onValueChange={(value) => setSaleForm({ ...saleForm, clientId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un client... | اختر حريفاً..." />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Réservoir * | الخزان *</Label>
                        <Select
                          value={saleForm.reservoirId}
                          onValueChange={(value) => setSaleForm({ ...saleForm, reservoirId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner... | اختر..." />
                          </SelectTrigger>
                          <SelectContent>
                            {reservoirs.filter(r => r.quantiteActuelle > 0).map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.code} - {r.quantiteActuelle.toLocaleString()} L
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Quantité (L) * | الكمية *</Label>
                        <Input
                          type="number"
                          value={saleForm.quantite}
                          onChange={(e) => setSaleForm({ ...saleForm, quantite: e.target.value })}
                          placeholder="0"
                          step="0.1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Prix unitaire (DT/L) * | السعر *</Label>
                        <Input
                          type="number"
                          value={saleForm.prixUnitaire}
                          onChange={(e) => setSaleForm({ ...saleForm, prixUnitaire: e.target.value })}
                          placeholder="0.000"
                          step="0.001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Taux TVA (%) | ض.ق.م</Label>
                        <Input
                          type="number"
                          value={saleForm.tauxTVA}
                          onChange={(e) => setSaleForm({ ...saleForm, tauxTVA: e.target.value })}
                          placeholder="19"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Droit de Timbre (DT) | حق الطابع</Label>
                        <Input
                          type="number"
                          value={saleForm.droitTimbre}
                          onChange={(e) => setSaleForm({ ...saleForm, droitTimbre: e.target.value })}
                          placeholder="1"
                          step="0.001"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Date * | التاريخ *</Label>
                        <Input
                          type="date"
                          value={saleForm.date}
                          onChange={(e) => setSaleForm({ ...saleForm, date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsSaleDialogOpen(false)}>
                        Annuler | إلغاء
                      </Button>
                      <Button type="submit">Créer le BL | إنشاء الوصل</Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={isReservoirDialogOpen} onOpenChange={setIsReservoirDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Réservoir | خزان جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif">Nouveau Réservoir | خزان جديد</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddReservoir} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Code du réservoir * | رمز الخزان *</Label>
                    <Input
                      id="code"
                      value={reservoirForm.code}
                      onChange={(e) => setReservoirForm({ ...reservoirForm, code: e.target.value })}
                      placeholder="Ex: RES-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacite">Capacité maximale (litres) * | السعة القصوى *</Label>
                    <Input
                      id="capacite"
                      type="number"
                      value={reservoirForm.capaciteMax}
                      onChange={(e) => setReservoirForm({ ...reservoirForm, capaciteMax: e.target.value })}
                      placeholder="Ex: 1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resObservations">Observations | ملاحظات</Label>
                    <Textarea
                      id="resObservations"
                      value={reservoirForm.observations}
                      onChange={(e) => setReservoirForm({ ...reservoirForm, observations: e.target.value })}
                      placeholder="Notes... | ملاحظات..."
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsReservoirDialogOpen(false)}>
                      Annuler | إلغاء
                    </Button>
                    <Button type="submit">Créer | إنشاء</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="Stock Total | المخزون الإجمالي"
          value={`${stats.totalStock.toLocaleString()} L`}
          subtitle={`Capacité | السعة: ${stats.totalCapacity.toLocaleString()} L`}
          icon={Database}
        />
        <StatCard
          title="Taux Remplissage | نسبة الامتلاء"
          value={`${stats.totalCapacity > 0 ? ((stats.totalStock / stats.totalCapacity) * 100).toFixed(0) : 0}%`}
          subtitle={`${reservoirs.length} réservoirs | خزانات`}
          icon={Droplets}
        />
        <StatCard
          title="Entrées (période) | المدخلات"
          value={`${stats.totalEntries.toLocaleString()} L`}
          subtitle="Huile entrée en stock | الزيت المدخل"
          icon={ArrowRightLeft}
        />
        <StatCard
          title="Ventes (période) | المبيعات"
          value={`${stats.totalSales.toLocaleString()} L`}
          subtitle="Huile vendue | الزيت المباع"
          icon={ShoppingCart}
        />
      </div>

      <Tabs defaultValue="reservoirs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reservoirs" className="gap-2">
            <Database className="h-4 w-4" />
            Réservoirs | الخزانات
          </TabsTrigger>
          <TabsTrigger value="affectation" className="gap-2">
            <Droplets className="h-4 w-4" />
            Affectation | التخصيص ({pendingAffectations.length})
          </TabsTrigger>
          <TabsTrigger value="historique" className="gap-2">
            <History className="h-4 w-4" />
            Historique | السجل
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reservoirs">
          <DataTable
            columns={reservoirColumns}
            data={reservoirs}
            emptyMessage="Aucun réservoir. Créez des réservoirs pour gérer votre stock d'huile. | لا توجد خزانات"
          />
        </TabsContent>

        <TabsContent value="affectation">
          {pendingAffectations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <Droplets className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Aucune affectation en attente | لا توجد تخصيصات معلقة</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Les BR de type Façon n'impactent pas le stock. Seuls les BR Bawaza et Achat à la base apparaissent ici. | وصولات الخدمة لا تؤثر على المخزون
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
                        <span className="text-muted-foreground">Client | الحريف: </span>
                        <span className="font-medium">{client.name}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Huile produite | الزيت المنتج: </span>
                        <span className="font-medium">{trit.quantiteHuile.toLocaleString()} L</span>
                      </div>
                      {client.transactionType === 'bawaza' && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Part huilerie | حصة المعصرة ({settings.partHuilerieBawaza}%): </span>
                          <span className="font-semibold text-primary">{targetQuantity.toFixed(1)} L</span>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-muted-foreground">Reste à affecter | المتبقي للتخصيص: </span>
                        <span className="font-semibold text-warning">{remaining.toFixed(1)} L</span>
                      </div>
                      <Button 
                        className="w-full mt-2" 
                        onClick={() => openAffectDialog(br, trit)}
                        disabled={reservoirs.filter(r => r.status !== 'plein').length === 0}
                      >
                        Affecter au stock | تخصيص للمخزون
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="historique" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Réservoir | الخزان</Label>
                  <Select value={selectedReservoir} onValueChange={setSelectedReservoir}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous | الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les réservoirs | كل الخزانات</SelectItem>
                      {reservoirs.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date début | تاريخ البداية</Label>
                  <Input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date fin | تاريخ النهاية</Label>
                  <Input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => { setSelectedReservoir('all'); setDateDebut(''); setDateFin(''); }}
                  >
                    Réinitialiser | إعادة تعيين
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <DataTable
            columns={movementColumns}
            data={filteredMovements}
            emptyMessage="Aucun mouvement de stock enregistré. | لا توجد حركات مخزون مسجلة"
          />
        </TabsContent>
      </Tabs>

      {/* Affectation Dialog */}
      <Dialog open={isAffectDialogOpen} onOpenChange={() => { setIsAffectDialogOpen(false); setSelectedTrit(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Affecter l'huile au stock | تخصيص الزيت للمخزون
            </DialogTitle>
          </DialogHeader>
          {selectedTrit && (
            <form onSubmit={handleAffect} className="space-y-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">BR | الوصل</span>
                  <span className="font-medium">{selectedTrit.br.number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Huile disponible | الزيت المتاح</span>
                  <span className="font-semibold text-primary">{selectedTrit.trit.quantiteHuile.toLocaleString()} L</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Réservoir * | الخزان *</Label>
                <Select
                  value={affectForm.reservoirId}
                  onValueChange={(value) => setAffectForm({ ...affectForm, reservoirId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un réservoir... | اختر خزاناً..." />
                  </SelectTrigger>
                  <SelectContent>
                    {reservoirs.filter(r => r.status !== 'plein').map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.code} - Dispo | متاح: {(r.capaciteMax - r.quantiteActuelle).toLocaleString()} L
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantité à affecter (litres) * | الكمية للتخصيص *</Label>
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
                  Annuler | إلغاء
                </Button>
                <Button type="submit">Affecter | تخصيص</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Stock;