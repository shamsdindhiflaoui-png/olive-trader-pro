import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { BonLivraison, PaymentMode } from '@/types';
import { ShoppingCart, FileText, Download, CheckCircle2, Clock, CreditCard, Wallet, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BonLivraisonPDF } from '@/components/pdf/BonLivraisonPDF';
import { formatNumber } from '@/lib/utils';

const paymentModeLabels: Record<PaymentMode, string> = {
  especes: 'Espèces | نقداً',
  virement: 'Virement | تحويل',
  compensation: 'Compensation | مقاصة',
};

const paymentModeIcons: Record<PaymentMode, React.ReactNode> = {
  especes: <Wallet className="h-4 w-4" />,
  virement: <CreditCard className="h-4 w-4" />,
  compensation: <ArrowRightLeft className="h-4 w-4" />,
};

export default function Vente() {
  const { 
    clients, 
    reservoirs, 
    bonsLivraison,
    settings,
    addSale,
    updateBLPayment,
  } = useAppStore();
  
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedBL, setSelectedBL] = useState<BonLivraison | null>(null);
  const [lastCreatedBL, setLastCreatedBL] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [saleForm, setSaleForm] = useState({
    clientId: '',
    reservoirId: '',
    quantite: '',
    prixUnitaire: '',
    tauxTVA: '19',
    droitTimbre: '1',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [paymentForm, setPaymentForm] = useState({
    modePayment: 'especes' as PaymentMode,
    reference: '',
    observations: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  // Statistics
  const stats = useMemo(() => {
    const totalVentes = bonsLivraison.length;
    const ventesPayees = bonsLivraison.filter(bl => bl.paymentStatus === 'paye').length;
    const ventesEnAttente = bonsLivraison.filter(bl => bl.paymentStatus === 'en_attente').length;
    const montantTotal = bonsLivraison.reduce((sum, bl) => sum + bl.montantTTC, 0);
    const montantPaye = bonsLivraison
      .filter(bl => bl.paymentStatus === 'paye')
      .reduce((sum, bl) => sum + bl.montantTTC, 0);
    
    return { totalVentes, ventesPayees, ventesEnAttente, montantTotal, montantPaye };
  }, [bonsLivraison]);

  // Filtered BLs
  const filteredBLs = useMemo(() => {
    if (filterStatus === 'all') return bonsLivraison;
    return bonsLivraison.filter(bl => bl.paymentStatus === filterStatus);
  }, [bonsLivraison, filterStatus]);

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
      toast.error('Vente impossible (quantité insuffisante dans le réservoir) | البيع مستحيل (كمية غير كافية)');
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBL) return;

    const success = updateBLPayment(selectedBL.id, {
      date: new Date(paymentForm.date),
      modePayment: paymentForm.modePayment,
      reference: paymentForm.reference || undefined,
      observations: paymentForm.observations || undefined,
    });

    if (success) {
      toast.success(`Paiement enregistré pour ${selectedBL.number} | تم تسجيل الدفع`);
      setIsPaymentDialogOpen(false);
      setSelectedBL(null);
      setPaymentForm({
        modePayment: 'especes',
        reference: '',
        observations: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    } else {
      toast.error("Erreur lors de l'enregistrement du paiement | خطأ في تسجيل الدفع");
    }
  };

  const openPaymentDialog = (bl: BonLivraison) => {
    setSelectedBL(bl);
    setIsPaymentDialogOpen(true);
  };

  const blColumns = [
    {
      key: 'number',
      header: 'N° BL | رقم وصل التسليم',
      render: (bl: BonLivraison) => <span className="font-mono font-medium text-primary">{bl.number}</span>,
    },
    {
      key: 'date',
      header: 'Date | التاريخ',
      render: (bl: BonLivraison) => format(new Date(bl.date), 'dd/MM/yyyy', { locale: fr }),
    },
    {
      key: 'client',
      header: 'Client | الحريف',
      render: (bl: BonLivraison) => {
        const client = clients.find(c => c.id === bl.clientId);
        return client?.name || '-';
      },
    },
    {
      key: 'quantite',
      header: 'Quantité | الكمية',
      render: (bl: BonLivraison) => `${formatNumber(bl.quantite)} L`,
    },
    {
      key: 'prixUnitaire',
      header: 'Prix U. | السعر',
      render: (bl: BonLivraison) => `${formatNumber(bl.prixUnitaire)} DT`,
    },
    {
      key: 'montantTTC',
      header: 'Montant TTC | المبلغ',
      render: (bl: BonLivraison) => <span className="font-semibold">{formatNumber(bl.montantTTC)} DT</span>,
    },
    {
      key: 'status',
      header: 'Statut | الحالة',
      render: (bl: BonLivraison) => (
        <Badge variant={bl.paymentStatus === 'paye' ? 'default' : 'secondary'} className={bl.paymentStatus === 'paye' ? 'bg-success text-success-foreground' : ''}>
          {bl.paymentStatus === 'paye' ? (
            <><CheckCircle2 className="h-3 w-3 mr-1" /> Payé | مدفوع</>
          ) : (
            <><Clock className="h-3 w-3 mr-1" /> En attente | معلق</>
          )}
        </Badge>
      ),
    },
    {
      key: 'payment',
      header: 'Mode | طريقة الدفع',
      render: (bl: BonLivraison) => {
        if (!bl.payment) return '-';
        return (
          <div className="flex items-center gap-1 text-sm">
            {paymentModeIcons[bl.payment.modePayment]}
            <span>{paymentModeLabels[bl.payment.modePayment]}</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions | إجراءات',
      render: (bl: BonLivraison) => {
        const client = clients.find(c => c.id === bl.clientId);
        return (
          <div className="flex items-center gap-2">
            {bl.paymentStatus === 'en_attente' && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => openPaymentDialog(bl)}
              >
                Régler | دفع
              </Button>
            )}
            {client && (
              <PDFDownloadLink
                document={<BonLivraisonPDF bl={bl} client={client} settings={settings} />}
                fileName={`BL_${bl.number}.pdf`}
              >
                {({ loading }) => (
                  <Button size="icon" variant="ghost" disabled={loading}>
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

  return (
    <MainLayout>
      <PageHeader 
        title="Ventes d'Huile | مبيعات الزيت" 
        description="Gestion des ventes en gros et suivi des paiements | إدارة المبيعات بالجملة ومتابعة المدفوعات"
        action={
          <Dialog open={isSaleDialogOpen} onOpenChange={(open) => { setIsSaleDialogOpen(open); if (!open) setLastCreatedBL(null); }}>
            <DialogTrigger asChild>
              <Button>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Nouvelle Vente | بيع جديد
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
                    <p className="text-sm text-muted-foreground">Bon de livraison créé avec succès | تم إنشاء وصل التسليم بنجاح</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Client | الحريف:</span>
                      <p className="font-medium">{lastCreatedBL.client?.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantité | الكمية:</span>
                      <p className="font-medium">{formatNumber(lastCreatedBL.bl.quantite)} L</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prix unitaire | السعر:</span>
                      <p className="font-medium">{formatNumber(lastCreatedBL.bl.prixUnitaire)} DT/L</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Montant TTC | المبلغ:</span>
                      <p className="font-medium">{formatNumber(lastCreatedBL.bl.montantTTC)} DT</p>
                    </div>
                  </div>
                  <PDFDownloadLink
                    document={<BonLivraisonPDF bl={lastCreatedBL.bl} client={lastCreatedBL.client} settings={settings} />}
                    fileName={`BL_${lastCreatedBL.bl.number}.pdf`}
                    className="w-full"
                  >
                    {({ loading }) => (
                      <Button className="w-full" variant="outline" disabled={loading}>
                        <Download className="mr-2 h-4 w-4" />
                        {loading ? 'Génération... | جاري التحميل...' : 'Télécharger le BL | تحميل الوصل'}
                      </Button>
                    )}
                  </PDFDownloadLink>
                  <Button className="w-full" onClick={() => setLastCreatedBL(null)}>
                    Nouvelle vente | بيع جديد
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSale} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Client * | الحريف *</Label>
                    <Select
                      value={saleForm.clientId}
                      onValueChange={(value) => setSaleForm({ ...saleForm, clientId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client... | اختر حريفاً..." />
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
                  <div className="space-y-2">
                    <Label>Réservoir source * | الخزان المصدر *</Label>
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
                            {r.code} - {formatNumber(r.quantiteActuelle)} L disponibles | متاح
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>TVA (%) | ض.ق.م</Label>
                      <Input
                        type="number"
                        value={saleForm.tauxTVA}
                        onChange={(e) => setSaleForm({ ...saleForm, tauxTVA: e.target.value })}
                        placeholder="19"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Droit de timbre (DT) | حق الطابع</Label>
                      <Input
                        type="number"
                        value={saleForm.droitTimbre}
                        onChange={(e) => setSaleForm({ ...saleForm, droitTimbre: e.target.value })}
                        placeholder="1"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Date | التاريخ</Label>
                    <Input
                      type="date"
                      value={saleForm.date}
                      onChange={(e) => setSaleForm({ ...saleForm, date: e.target.value })}
                    />
                  </div>
                  {saleForm.quantite && saleForm.prixUnitaire && (
                    <div className="p-3 rounded-lg bg-secondary/30 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Montant HT | المبلغ خام:</span>
                        <span>{formatNumber(Number(saleForm.quantite) * Number(saleForm.prixUnitaire))} DT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TVA ({saleForm.tauxTVA}%) | ض.ق.م:</span>
                        <span>{formatNumber(Number(saleForm.quantite) * Number(saleForm.prixUnitaire) * Number(saleForm.tauxTVA) / 100)} DT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Droit de timbre | حق الطابع:</span>
                        <span>{formatNumber(Number(saleForm.droitTimbre))} DT</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-1 border-t">
                        <span>Total TTC | المجموع:</span>
                        <span>
                          {formatNumber(
                            Number(saleForm.quantite) * Number(saleForm.prixUnitaire) * (1 + Number(saleForm.tauxTVA) / 100) + Number(saleForm.droitTimbre)
                          )} DT
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsSaleDialogOpen(false)}>
                      Annuler | إلغاء
                    </Button>
                    <Button type="submit">Enregistrer la vente | تسجيل البيع</Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Ventes | إجمالي المبيعات"
          value={stats.totalVentes.toString()}
          icon={ShoppingCart}
        />
        <StatCard
          title="Ventes Payées | المبيعات المدفوعة"
          value={stats.ventesPayees.toString()}
          icon={CheckCircle2}
          subtitle={`${stats.totalVentes > 0 ? Math.round((stats.ventesPayees / stats.totalVentes) * 100) : 0}% du total | من المجموع`}
        />
        <StatCard
          title="En Attente | في الانتظار"
          value={stats.ventesEnAttente.toString()}
          icon={Clock}
        />
        <StatCard
          title="Montant Total | المبلغ الإجمالي"
          value={`${formatNumber(stats.montantTotal)} DT`}
          icon={CreditCard}
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>Statut | الحالة:</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous | الكل</SelectItem>
              <SelectItem value="en_attente">En attente | معلق</SelectItem>
              <SelectItem value="paye">Payé | مدفوع</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* BL List */}
      <DataTable
        columns={blColumns}
        data={filteredBLs}
        emptyMessage="Aucune vente enregistrée | لا توجد مبيعات مسجلة"
      />

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Régler le BL | دفع وصل التسليم {selectedBL?.number}</DialogTitle>
          </DialogHeader>
          {selectedBL && (
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Client | الحريف:</span>
                    <p className="font-medium">{clients.find(c => c.id === selectedBL.clientId)?.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant TTC | المبلغ:</span>
                    <p className="font-semibold text-primary">{formatNumber(selectedBL.montantTTC)} DT</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date de règlement * | تاريخ الدفع *</Label>
                <Input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Mode de paiement * | طريقة الدفع *</Label>
                <Select
                  value={paymentForm.modePayment}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, modePayment: value as PaymentMode })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="especes">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Espèces | نقداً
                      </div>
                    </SelectItem>
                    <SelectItem value="virement">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Virement | تحويل
                      </div>
                    </SelectItem>
                    <SelectItem value="compensation">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4" />
                        Compensation | مقاصة
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Référence | المرجع</Label>
                <Input
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="N° chèque, virement... | رقم الشيك، التحويل..."
                />
              </div>
              <div className="space-y-2">
                <Label>Observations | ملاحظات</Label>
                <Textarea
                  value={paymentForm.observations}
                  onChange={(e) => setPaymentForm({ ...paymentForm, observations: e.target.value })}
                  placeholder="Notes supplémentaires... | ملاحظات إضافية..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Annuler | إلغاء
                </Button>
                <Button type="submit">Confirmer le paiement | تأكيد الدفع</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}