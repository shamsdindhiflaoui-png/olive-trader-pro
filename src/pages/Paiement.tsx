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
import { BRNature, PaymentMode, PaymentReceipt, CashFlowType } from '@/types';

interface BRToPay {
  id: string;
  brNumber: string;
  brDate: Date;
  clientId: string;
  clientName: string;
  nature: BRNature;
  poidsNet: number;
  quantiteHuile: number;
  prixHuileKg?: number; // Prix pré-défini lors de l'affectation stock (pour bawaz)
  isAffectedToStock: boolean; // BR affecté au stock
  isPaid: boolean;
}

export default function Paiement() {
  const { t, language } = useLanguageStore();
  const dateLocale = language === 'ar' ? ar : fr;

  const natureLabels: Record<BRNature, string> = {
    bawaz: t('Achat Huile', 'شراء زيت'),
  };

  const cashFlowLabels: Record<CashFlowType, string> = {
    entrant: t('Encaissement', 'تحصيل'),
    sortant: t('Décaissement', 'صرف'),
  };

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
  const [filterNature, setFilterNature] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'service' | 'bawaz'>('service');

  const [formData, setFormData] = useState({
    prixUnitaire: 0,
    modePayment: 'especes' as PaymentMode,
    date: format(new Date(), 'yyyy-MM-dd'),
    observations: '',
  });

  // Get all closed BRs with trituration
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
          nature: br.nature || 'service',
          poidsNet: br.poidsNet,
          quantiteHuile: trituration.quantiteHuile,
          prixHuileKg: trituration.prixHuileKg, // Prix défini lors de l'affectation
          isAffectedToStock,
          isPaid,
        } as BRToPay;
      })
      .filter(Boolean) as BRToPay[];
  }, [bonsReception, triturations, clients, paymentReceipts, stockAffectations]);

  // Filter BRs: 
  // - Service: show all closed BRs
  // - Bawaz: show only BRs that are affected to stock (with price defined)
  const filteredBRs = useMemo(() => {
    return brsWithTrituration.filter(br => {
      // Filter by nature (tab)
      if (br.nature !== activeTab) return false;
      
      // For bawaz, only show BRs that are affected to stock
      if (br.nature === 'bawaz' && !br.isAffectedToStock) return false;
      
      if (filterClient !== 'all' && br.clientId !== filterClient) return false;
      if (filterStatus === 'unpaid' && br.isPaid) return false;
      if (filterStatus === 'paid' && !br.isPaid) return false;
      return true;
    });
  }, [brsWithTrituration, filterClient, filterStatus, activeTab]);

  // Stats per nature
  const stats = useMemo(() => {
    const serviceBRs = brsWithTrituration.filter(br => br.nature === 'service');
    const bawazBRs = brsWithTrituration.filter(br => br.nature === 'bawaz');
    
    const serviceReceipts = paymentReceipts.filter(pr => pr.nature === 'service');
    const bawazReceipts = paymentReceipts.filter(pr => pr.nature === 'bawaz');
    
    return {
      serviceUnpaid: serviceBRs.filter(br => !br.isPaid).length,
      servicePaid: serviceBRs.filter(br => br.isPaid).length,
      serviceTotalEncaisse: serviceReceipts.reduce((sum, pr) => sum + pr.totalMontant, 0),
      bawazUnpaid: bawazBRs.filter(br => !br.isPaid).length,
      bawazPaid: bawazBRs.filter(br => br.isPaid).length,
      bawazTotalDecaisse: bawazReceipts.reduce((sum, pr) => sum + pr.totalMontant, 0),
    };
  }, [brsWithTrituration, paymentReceipts]);

  // Get selected BRs info
  const selectedBRsInfo = useMemo(() => {
    const selected = filteredBRs.filter(br => selectedBRs.includes(br.id) && !br.isPaid);
    if (selected.length === 0) return null;
    
    const clientId = selected[0].clientId;
    const nature = selected[0].nature;
    const allSameClient = selected.every(br => br.clientId === clientId);
    const allSameNature = selected.every(br => br.nature === nature);
    const client = clients.find(c => c.id === clientId);
    
    return {
      count: selected.length,
      allSameClient,
      allSameNature,
      clientId,
      clientName: client?.name || '',
      nature,
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

    if (!selectedBRsInfo?.allSameNature) {
      toast({
        title: t("Erreur", "خطأ"),
        description: t("Impossible de mélanger des natures différentes (Service/Bawaz) dans un même reçu.", "لا يمكن خلط أنواع مختلفة (خدمة/باواز) في نفس الوصل."),
        variant: "destructive",
      });
      return;
    }
    
    // Set default price based on nature
    const defaultPrice = selectedBRsInfo.nature === 'service' 
      ? settings.defaultPrixFacon 
      : settings.defaultPrixBase;
    
    setFormData(prev => ({
      ...prev,
      prixUnitaire: defaultPrice,
    }));
    
    setIsCreateDialogOpen(true);
  };

  const handleCreateReceipt = () => {
    if (!selectedBRsInfo) return;
    
    // For service: validate form price
    // For bawaz: validate predefined prices exist
    if (selectedBRsInfo.nature === 'service') {
      if (formData.prixUnitaire <= 0) {
        toast({
          title: t("Erreur", "خطأ"),
          description: t("Le prix unitaire est obligatoire.", "السعر الوحدوي إجباري."),
          variant: "destructive",
        });
        return;
      }
    } else {
      // Bawaz: check all selected BRs have predefined prices
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
    }
    
    // For bawaz, we need to pass prices per BR
    const prixUnitaire = selectedBRsInfo.nature === 'service' 
      ? formData.prixUnitaire 
      : 0; // Will be calculated per BR in store
    
    const receipt = addPaymentReceipt({
      clientId: selectedBRsInfo.clientId,
      brIds: selectedBRs,
      prixUnitaire,
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
        prixUnitaire: 0,
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
    
    // For bawaz, use the predefined price per BR
    // For service, use the form price
    const lines = selectedItems.map(br => {
      let amount: number;
      let priceUsed: number;
      
      if (br.nature === 'bawaz' && br.prixHuileKg) {
        // Bawaz: use predefined price * oil quantity
        priceUsed = br.prixHuileKg;
        amount = br.quantiteHuile * priceUsed;
      } else {
        // Service: use form price * weight
        priceUsed = formData.prixUnitaire;
        amount = br.poidsNet * priceUsed;
      }
      
      return { brNumber: br.brNumber, amount, priceUsed, quantite: br.nature === 'bawaz' ? br.quantiteHuile : br.poidsNet };
    });
    
    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    const isValid = selectedBRsInfo.nature === 'bawaz' 
      ? selectedItems.every(br => br.prixHuileKg && br.prixHuileKg > 0)
      : formData.prixUnitaire > 0;
    
    return { lines, total, isValid };
  }, [selectedBRs, selectedBRsInfo, formData.prixUnitaire, filteredBRs]);

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
      key: 'nature',
      header: t('Nature', 'النوع'),
      render: (br: BRToPay) => (
        <Badge variant={br.nature === 'service' ? 'default' : 'secondary'} className={br.nature === 'service' ? 'bg-green-600' : 'bg-orange-500'}>
          {natureLabels[br.nature]}
        </Badge>
      ),
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
        if (br.nature === 'bawaz' && br.prixHuileKg) {
          return (
            <span className="font-medium text-orange-600">
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
        description={t('Gestion des règlements des bons de réception', 'إدارة تسديد وصولات الاستلام')}
      />

      {/* Stats per nature */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {/* Service stats */}
        <StatCard
          title={t("Service - Non Payés", "خدمة - غير مدفوعة")}
          value={stats.serviceUnpaid}
          icon={<Clock className="h-5 w-5 text-green-600" />}
        />
        <StatCard
          title={t("Service - Payés", "خدمة - مدفوعة")}
          value={stats.servicePaid}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
        />
        <StatCard
          title={t("Total Encaissé", "إجمالي التحصيل")}
          value={`${stats.serviceTotalEncaisse.toFixed(3)} DT`}
          icon={<Wallet className="h-5 w-5 text-green-600" />}
        />
        {/* Bawaz stats */}
        <StatCard
          title={t("Bawaz - Non Payés", "باواز - غير مدفوعة")}
          value={stats.bawazUnpaid}
          icon={<Clock className="h-5 w-5 text-orange-500" />}
        />
        <StatCard
          title={t("Bawaz - Payés", "باواز - مدفوعة")}
          value={stats.bawazPaid}
          icon={<CheckCircle2 className="h-5 w-5 text-orange-500" />}
        />
        <StatCard
          title={t("Total Décaissé", "إجمالي الصرف")}
          value={`${stats.bawazTotalDecaisse.toFixed(3)} DT`}
          icon={<Wallet className="h-5 w-5 text-orange-500" />}
        />
      </div>

      {/* Nature Tabs */}
      <div className="flex gap-2 mb-4">
        <Button 
          variant={activeTab === 'service' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('service'); setSelectedBRs([]); }}
          className={activeTab === 'service' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          💰 {t('Service (Encaissement)', 'خدمة (تحصيل)')}
        </Button>
        <Button 
          variant={activeTab === 'bawaz' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('bawaz'); setSelectedBRs([]); }}
          className={activeTab === 'bawaz' ? 'bg-orange-500 hover:bg-orange-600' : ''}
        >
          💸 {t('Bawaz (Décaissement)', 'باواز (صرف)')}
        </Button>
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
          emptyMessage={t("Aucun BR fermé disponible", "لا توجد وصولات مغلقة متاحة")}
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
                  {selectedBRs.length} {t('BR sélectionné(s)', 'وصل محدد')} - {natureLabels[selectedBRsInfo.nature]}
                </p>
                <Badge className={selectedBRsInfo.nature === 'service' ? 'bg-green-600 mt-2' : 'bg-orange-500 mt-2'}>
                  {selectedBRsInfo.nature === 'service' 
                    ? t('💰 Flux Entrant (Encaissement)', '💰 تدفق وارد (تحصيل)')
                    : t('💸 Flux Sortant (Décaissement)', '💸 تدفق صادر (صرف)')
                  }
                </Badge>
              </div>

              {/* For Service: show price input */}
              {selectedBRsInfo.nature === 'service' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('Prix trituration (DT/kg)', 'سعر العصر (د.ت/كغ)')}</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={formData.prixUnitaire}
                      onChange={(e) => setFormData(prev => ({ ...prev, prixUnitaire: parseFloat(e.target.value) || 0 }))}
                    />
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
              )}

              {/* For Bawaz: show details with predefined prices */}
              {selectedBRsInfo.nature === 'bawaz' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border-2 border-orange-200 bg-orange-50">
                    <h4 className="font-medium text-orange-800 mb-2">
                      💸 {t('Détails des BR Bawaz', 'تفاصيل وصولات الباواز')}
                    </h4>
                    <p className="text-xs text-orange-700 mb-3">
                      {t('Les prix ont été définis lors de l\'affectation au stock', 'تم تحديد الأسعار عند تخصيص المخزون')}
                    </p>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {filteredBRs.filter(br => selectedBRs.includes(br.id) && !br.isPaid).map(br => (
                        <div key={br.id} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                          <div>
                            <span className="font-mono font-medium">{br.brNumber}</span>
                            <span className="text-muted-foreground ml-2">
                              {br.quantiteHuile.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} L
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-orange-600 font-medium">
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
              )}

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
                    <span className={selectedBRsInfo.nature === 'bawaz' ? 'text-orange-600' : 'text-green-600'}>
                      {previewAmounts.total.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT
                    </span>
                  </div>
                  {selectedBRsInfo.nature === 'bawaz' && (
                    <p className="text-xs text-orange-700 mt-2 p-2 bg-orange-50 rounded">
                      💸 {t("Ce montant sera payé par l'huilerie au client", 'سيدفع هذا المبلغ من المعصرة للحريف')}
                    </p>
                  )}
                  {selectedBRsInfo.nature === 'service' && (
                    <p className="text-xs text-green-700 mt-2 p-2 bg-green-50 rounded">
                      💰 {t("Ce montant sera encaissé par l'huilerie", 'سيتم تحصيل هذا المبلغ من طرف المعصرة')}
                    </p>
                  )}
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
                      <th className="text-right p-2">{t('Qté', 'الكمية')}</th>
                      <th className="text-right p-2">{t('P.U.', 'السعر')}</th>
                      <th className="text-right p-2">{t('Montant', 'المبلغ')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReceipt.lines.map((line, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2 font-mono">{line.brNumber}</td>
                        <td className="p-2 text-right">
                          {selectedReceipt.nature === 'service' 
                            ? `${line.poidsNet} kg`
                            : `${line.quantiteHuile} L`
                          }
                        </td>
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
            {(() => {
              const client = getClientForReceipt(selectedReceipt);
              return client ? (
                <PDFDownloadButton
                  document={<PaymentReceiptPDF receipt={selectedReceipt} client={client} settings={settings} />}
                  fileName={`Recu_${selectedReceipt.number}.pdf`}
                  label={t("Télécharger PDF", "تحميل PDF")}
                  variant="default"
                  size="default"
                />
              ) : null;
            })()}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}