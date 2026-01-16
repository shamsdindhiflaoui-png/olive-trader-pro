import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { useAppStore } from '@/store/appStore';
import { useLanguageStore } from '@/store/languageStore';
import { useToast } from '@/hooks/use-toast';
import { Receipt, FileText, CheckCircle2, Clock, CreditCard, Wallet, ArrowRightLeft } from 'lucide-react';
import { PDFDownloadButton } from '@/components/pdf/PDFDownloadButton';
import { PaymentReceiptPDF } from '@/components/pdf/PaymentReceiptPDF';
import { PaymentMode, PaymentReceipt } from '@/types';

interface BRToPay {
  id: string;
  brNumber: string;
  brDate: Date;
  clientId: string;
  clientName: string;
  poidsNet: number;
  quantiteHuile: number;
  prixHuileKg?: number;
  isAffectedToStock: boolean;
  isPaid: boolean;
}

export default function Paiement() {
  const { t, language } = useLanguageStore();
  const dateLocale = language === 'ar' ? ar : fr;

  const paymentModeLabels: Record<PaymentMode, string> = {
    especes: t('Espèces', 'نقداً'),
    virement: t('Virement', 'تحويل'),
    compensation: t('Compensation', 'مقاصة'),
  };
  const { bonsReception, triturations, clients, paymentReceipts, settings, addPaymentReceipt, stockAffectations } = useAppStore();

  const getClientForReceipt = (receipt: PaymentReceipt | null) => {
    if (!receipt) return null;
    return clients.find(c => c.id === receipt.clientId);
  };
  const { toast } = useToast();

  const [selectedBRs, setSelectedBRs] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('unpaid');

  const [formData, setFormData] = useState({
    modePayment: 'especes' as PaymentMode,
    date: format(new Date(), 'yyyy-MM-dd'),
    observations: '',
  });

  // Get all closed BRs with trituration (all are bawaz now)
  const brsWithTrituration = useMemo(() => {
    return bonsReception
      .filter(br => br.status === 'closed')
      .map(br => {
        const trituration = triturations.find(t => t.brId === br.id);
        const client = clients.find(c => c.id === br.clientId);
        
        // Check if already paid
        const isPaid = paymentReceipts.some(pr => 
          pr.lines.some(line => line.brId === br.id)
        );
        
        // Check if affected to stock
        const isAffectedToStock = stockAffectations.some(sa => sa.brId === br.id);
        
        if (!trituration || !client) return null;
        
        return {
          id: br.id,
          brNumber: br.number,
          brDate: br.date,
          clientId: br.clientId,
          clientName: client.name,
          poidsNet: br.poidsNet,
          quantiteHuile: trituration.quantiteHuile,
          prixHuileKg: trituration.prixHuileKg,
          isAffectedToStock,
          isPaid,
        } as BRToPay;
      })
      .filter(Boolean) as BRToPay[];
  }, [bonsReception, triturations, clients, paymentReceipts, stockAffectations]);

  // Filter BRs: only show BRs that are affected to stock (with price defined)
  const filteredBRs = useMemo(() => {
    return brsWithTrituration.filter(br => {
      // Only show BRs that are affected to stock
      if (!br.isAffectedToStock) return false;
      
      if (filterClient !== 'all' && br.clientId !== filterClient) return false;
      if (filterStatus === 'unpaid' && br.isPaid) return false;
      if (filterStatus === 'paid' && !br.isPaid) return false;
      return true;
    });
  }, [brsWithTrituration, filterClient, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const affectedBRs = brsWithTrituration.filter(br => br.isAffectedToStock);
    
    return {
      unpaid: affectedBRs.filter(br => !br.isPaid).length,
      paid: affectedBRs.filter(br => br.isPaid).length,
      totalDecaisse: paymentReceipts.reduce((sum, pr) => sum + pr.totalMontant, 0),
    };
  }, [brsWithTrituration, paymentReceipts]);

  // Get selected BRs info
  const selectedBRsInfo = useMemo(() => {
    const selected = filteredBRs.filter(br => selectedBRs.includes(br.id) && !br.isPaid);
    if (selected.length === 0) return null;
    
    const clientId = selected[0].clientId;
    const allSameClient = selected.every(br => br.clientId === clientId);
    const client = clients.find(c => c.id === clientId);
    
    return {
      count: selected.length,
      allSameClient,
      clientId,
      clientName: client?.name || '',
    };
  }, [selectedBRs, filteredBRs, clients]);

  const handleSelectBR = (brId: string, checked: boolean) => {
    if (checked) {
      setSelectedBRs(prev => [...prev, brId]);
    } else {
      setSelectedBRs(prev => prev.filter(id => id !== brId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const unpaidIds = filteredBRs.filter(br => !br.isPaid).map(br => br.id);
      setSelectedBRs(unpaidIds);
    } else {
      setSelectedBRs([]);
    }
  };

  const openCreateDialog = () => {
    if (!selectedBRsInfo?.allSameClient) {
      toast({
        title: t("Erreur", "خطأ"),
        description: t("Impossible de mélanger des clients différents dans un même reçu.", "لا يمكن خلط حرفاء مختلفين في نفس الوصل."),
        variant: "destructive",
      });
      return;
    }
    
    setIsCreateDialogOpen(true);
  };

  const handleCreateReceipt = () => {
    if (!selectedBRsInfo) return;
    
    // Check all selected BRs have predefined prices
    const selectedItems = filteredBRs.filter(br => selectedBRs.includes(br.id) && !br.isPaid);
    const missingPrice = selectedItems.some(br => !br.prixHuileKg || br.prixHuileKg <= 0);
    if (missingPrice) {
      toast({
        title: t("Erreur", "خطأ"),
        description: t("Certains BR n'ont pas de prix défini. Veuillez affecter l'huile au stock d'abord.", "بعض الوصولات ليس لها سعر محدد. يرجى تخصيص الزيت للمخزون أولاً."),
        variant: "destructive",
      });
      return;
    }
    
    const receipt = addPaymentReceipt({
      clientId: selectedBRsInfo.clientId,
      brIds: selectedBRs,
      prixUnitaire: 0, // Will be calculated per BR in store
      modePayment: formData.modePayment,
      date: new Date(formData.date),
      observations: formData.observations || undefined,
    });
    
    if (receipt) {
      toast({
        title: t("Reçu créé", "تم إنشاء الوصل"),
        description: t(`Le reçu ${receipt.number} a été créé avec succès.`, `تم إنشاء الوصل ${receipt.number} بنجاح.`),
      });
      setSelectedBRs([]);
      setIsCreateDialogOpen(false);
      setFormData({
        modePayment: 'especes',
        date: format(new Date(), 'yyyy-MM-dd'),
        observations: '',
      });
    } else {
      toast({
        title: t("Erreur", "خطأ"),
        description: t("Impossible de créer le reçu. Vérifiez les données.", "تعذر إنشاء الوصل. تحقق من البيانات."),
        variant: "destructive",
      });
    }
  };

  const openDetailDialog = (receipt: PaymentReceipt) => {
    setSelectedReceipt(receipt);
    setIsDetailDialogOpen(true);
  };

  // Calculate preview amounts
  const previewAmounts = useMemo(() => {
    if (!selectedBRsInfo) return null;
    
    const selectedItems = filteredBRs.filter(br => selectedBRs.includes(br.id) && !br.isPaid);
    
    const lines = selectedItems.map(br => {
      const priceUsed = br.prixHuileKg || 0;
      const amount = br.quantiteHuile * priceUsed;
      
      return { brNumber: br.brNumber, amount, priceUsed, quantite: br.quantiteHuile };
    });
    
    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    const isValid = selectedItems.every(br => br.prixHuileKg && br.prixHuileKg > 0);
    
    return { lines, total, isValid };
  }, [selectedBRs, selectedBRsInfo, filteredBRs]);

  // BR columns
  const brColumns = [
    {
      key: 'select',
      header: () => (
        <Checkbox
          checked={selectedBRs.length === filteredBRs.filter(br => !br.isPaid).length && filteredBRs.some(br => !br.isPaid)}
          onCheckedChange={handleSelectAll}
        />
      ),
      render: (br: BRToPay) => (
        <Checkbox
          checked={selectedBRs.includes(br.id)}
          onCheckedChange={(checked) => handleSelectBR(br.id, checked as boolean)}
          disabled={br.isPaid}
        />
      ),
    },
    {
      key: 'brNumber',
      header: t('N° BR', 'رقم الوصل'),
      render: (br: BRToPay) => <span className="font-mono font-medium">{br.brNumber}</span>,
    },
    {
      key: 'brDate',
      header: t('Date BR', 'التاريخ'),
      render: (br: BRToPay) => format(new Date(br.brDate), 'dd/MM/yyyy', { locale: dateLocale }),
    },
    {
      key: 'clientName',
      header: t('Client', 'الحريف'),
    },
    {
      key: 'poidsNet',
      header: t('Poids Net (kg)', 'الوزن الصافي (كغ)'),
      render: (br: BRToPay) => br.poidsNet.toLocaleString(),
    },
    {
      key: 'quantiteHuile',
      header: t('Huile (L)', 'الزيت (ل)'),
      render: (br: BRToPay) => br.quantiteHuile.toLocaleString('fr-FR', { minimumFractionDigits: 3 }),
    },
    {
      key: 'prixHuileKg',
      header: t('Prix/Kg', 'السعر/كغ'),
      render: (br: BRToPay) => {
        if (br.prixHuileKg) {
          return (
            <span className="font-medium text-primary">
              {br.prixHuileKg.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT
            </span>
          );
        }
        return <span className="text-muted-foreground">-</span>;
      },
    },
    {
      key: 'isPaid',
      header: t('Statut', 'الحالة'),
      render: (br: BRToPay) => br.isPaid ? (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {t('Payé', 'مدفوع')}
        </Badge>
      ) : (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          {t('Non payé', 'غير مدفوع')}
        </Badge>
      ),
    },
  ];

  // Receipt columns
  const receiptColumns = [
    {
      key: 'number',
      header: t('N° Reçu', 'رقم الوصل'),
      render: (r: PaymentReceipt) => <span className="font-mono font-medium">{r.number}</span>,
    },
    {
      key: 'date',
      header: t('Date', 'التاريخ'),
      render: (r: PaymentReceipt) => format(new Date(r.date), 'dd/MM/yyyy', { locale: dateLocale }),
    },
    {
      key: 'client',
      header: t('Client', 'الحريف'),
      render: (r: PaymentReceipt) => {
        const client = clients.find(c => c.id === r.clientId);
        return client?.name || '-';
      },
    },
    {
      key: 'brCount',
      header: t('Nb BR', 'عدد الوصولات'),
      render: (r: PaymentReceipt) => r.lines.length,
    },
    {
      key: 'totalMontant',
      header: t('Montant Total', 'المبلغ الإجمالي'),
      render: (r: PaymentReceipt) => `${r.totalMontant.toFixed(3)} DT`,
    },
    {
      key: 'modePayment',
      header: t('Mode', 'الطريقة'),
      render: (r: PaymentReceipt) => (
        <Badge variant="outline">{paymentModeLabels[r.modePayment]}</Badge>
      ),
    },
    {
      key: 'actions',
      header: t('Actions', 'إجراءات'),
      render: (r: PaymentReceipt) => {
        const client = getClientForReceipt(r);
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => openDetailDialog(r)}>
              <FileText className="h-4 w-4" />
            </Button>
            {client && (
              <PDFDownloadButton
                document={<PaymentReceiptPDF receipt={r} client={client} settings={settings} />}
                fileName={`Recu_${r.number}.pdf`}
                label=""
                variant="ghost"
                size="icon"
              />
            )}
          </div>
        );
      },
    },
  ];

  const uniqueClients = useMemo(() => {
    const clientIds = [...new Set(brsWithTrituration.map(br => br.clientId))];
    return clientIds.map(id => clients.find(c => c.id === id)).filter(Boolean);
  }, [brsWithTrituration, clients]);

  return (
    <MainLayout>
      <PageHeader 
        title={t('Paiement', 'الدفع')}
        description={t('Gestion des règlements des achats d\'huile', 'إدارة تسديد مشتريات الزيت')}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title={t("Non Payés", "غير مدفوعة")}
          value={stats.unpaid}
          icon={<Clock className="h-5 w-5 text-orange-500" />}
        />
        <StatCard
          title={t("Payés", "مدفوعة")}
          value={stats.paid}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
        />
        <StatCard
          title={t("Total Décaissé", "إجمالي الصرف")}
          value={`${stats.totalDecaisse.toFixed(3)} DT`}
          icon={<Wallet className="h-5 w-5 text-primary" />}
        />
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Label>{t('Client', 'الحريف')}:</Label>
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("Tous", "الكل")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Tous les clients", "كل الحرفاء")}</SelectItem>
              {uniqueClients.map(client => client && (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Label>{t('Statut', 'الحالة')}:</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Tous", "الكل")}</SelectItem>
              <SelectItem value="unpaid">{t("Non payés", "غير مدفوعة")}</SelectItem>
              <SelectItem value="paid">{t("Payés", "مدفوعة")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        {selectedBRs.length > 0 && selectedBRsInfo && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {selectedBRs.length} {t('BR sélectionné(s)', 'وصل محدد')}
              {!selectedBRsInfo.allSameClient && (
                <span className="text-destructive ml-2">({t('clients différents!', 'حرفاء مختلفين!')})</span>
              )}
            </span>
            <Button onClick={openCreateDialog} disabled={!selectedBRsInfo.allSameClient}>
              <Receipt className="h-4 w-4 mr-2" />
              {t('Créer un reçu de règlement', 'إنشاء وصل تسديد')}
            </Button>
          </div>
        )}
      </div>

      {/* BR List */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">{t('Liste des BR à payer', 'قائمة الوصولات للدفع')}</h3>
        <DataTable
          columns={brColumns}
          data={filteredBRs}
          emptyMessage={t("Aucun BR disponible pour paiement", "لا توجد وصولات متاحة للدفع")}
        />
      </div>


      {/* Receipts History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('Historique des reçus', 'سجل الوصولات')}</h3>
        <DataTable
          columns={receiptColumns}
          data={paymentReceipts}
          emptyMessage={t("Aucun reçu de règlement", "لا توجد وصولات تسديد")}
        />
      </div>

      {/* Create Receipt Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('Créer un reçu de règlement', 'إنشاء وصل تسديد')}</DialogTitle>
          </DialogHeader>
          
          {selectedBRsInfo && (
            <div className="space-y-4">
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="font-medium">{selectedBRsInfo.clientName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedBRs.length} {t('BR sélectionné(s)', 'وصل محدد')}
                </p>
                <Badge className="bg-primary mt-2">
                  💸 {t('Flux Sortant (Décaissement)', 'تدفق صادر (صرف)')}
                </Badge>
              </div>

              {/* Show details with predefined prices */}
              <div className="space-y-3">
                <div className="p-3 rounded-lg border-2 border-primary/20 bg-primary/5">
                  <h4 className="font-medium text-primary mb-2">
                    💸 {t('Détails des BR', 'تفاصيل الوصولات')}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t('Les prix ont été définis lors de l\'affectation au stock', 'تم تحديد الأسعار عند تخصيص المخزون')}
                  </p>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {filteredBRs.filter(br => selectedBRs.includes(br.id) && !br.isPaid).map(br => (
                      <div key={br.id} className="flex justify-between items-center text-sm bg-background p-2 rounded">
                        <div>
                          <span className="font-mono font-medium">{br.brNumber}</span>
                          <span className="text-muted-foreground ml-2">
                            {br.quantiteHuile.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} L
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-primary font-medium">
                            {br.prixHuileKg?.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT/kg
                          </span>
                          <span className="text-muted-foreground ml-2">
                            = {((br.prixHuileKg || 0) * br.quantiteHuile).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>{t('Date de règlement', 'تاريخ التسديد')}</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>{t('Mode de règlement', 'طريقة الدفع')}</Label>
                <Select value={formData.modePayment} onValueChange={(v) => setFormData(prev => ({ ...prev, modePayment: v as PaymentMode }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="especes">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        {t('Espèces', 'نقداً')}
                      </div>
                    </SelectItem>
                    <SelectItem value="virement">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {t('Virement', 'تحويل')}
                      </div>
                    </SelectItem>
                    <SelectItem value="compensation">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4" />
                        {t('Compensation', 'مقاصة')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('Observations', 'ملاحظات')}</Label>
                <Textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder={t("Observations optionnelles...", "ملاحظات اختيارية...")}
                />
              </div>

              {/* Preview */}
              {previewAmounts && previewAmounts.isValid && (
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">{t('Aperçu du calcul', 'معاينة الحساب')}</h4>
                  {previewAmounts.lines.map((line, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{line.brNumber}</span>
                      <span className="text-muted-foreground">
                        {line.quantite.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} × {line.priceUsed.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} = 
                      </span>
                      <span className="font-medium">{line.amount.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                    <span>{t('Total', 'المجموع')}</span>
                    <span className="text-primary">
                      {previewAmounts.total.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                    💸 {t("Ce montant sera payé par l'huilerie au client", 'سيدفع هذا المبلغ من المعصرة للحريف')}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('Annuler', 'إلغاء')}
            </Button>
            <Button onClick={handleCreateReceipt}>
              {t('Valider le règlement', 'تأكيد التسديد')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('Détails du reçu', 'تفاصيل الوصل')}</DialogTitle>
          </DialogHeader>
          
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('N° Reçu', 'رقم الوصل')}</p>
                  <p className="font-mono font-medium">{selectedReceipt.number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Date', 'التاريخ')}</p>
                  <p>{format(new Date(selectedReceipt.date), 'dd/MM/yyyy', { locale: dateLocale })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Client', 'الحريف')}</p>
                  <p className="font-medium">
                    {clients.find(c => c.id === selectedReceipt.clientId)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Mode de paiement', 'طريقة الدفع')}</p>
                  <Badge variant="outline">{paymentModeLabels[selectedReceipt.modePayment]}</Badge>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">{t('BR', 'الوصل')}</th>
                      <th className="text-right p-2">{t('Huile (L)', 'الزيت (ل)')}</th>
                      <th className="text-right p-2">{t('P.U.', 'السعر')}</th>
                      <th className="text-right p-2">{t('Montant', 'المبلغ')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReceipt.lines.map((line, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2 font-mono">{line.brNumber}</td>
                        <td className="p-2 text-right">{line.quantiteHuile?.toFixed(3) || '-'} L</td>
                        <td className="p-2 text-right">{line.prixUnitaire.toFixed(3)}</td>
                        <td className="p-2 text-right font-medium">{line.montant.toFixed(3)} DT</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted font-semibold">
                    <tr>
                      <td colSpan={3} className="p-2 text-right">{t('Total', 'المجموع')}</td>
                      <td className="p-2 text-right">{selectedReceipt.totalMontant.toFixed(3)} DT</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedReceipt.observations && (
                <div>
                  <p className="text-muted-foreground text-sm">{t('Observations', 'ملاحظات')}</p>
                  <p className="text-sm">{selectedReceipt.observations}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              {t('Fermer', 'إغلاق')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
