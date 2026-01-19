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
import { Receipt, FileText, CheckCircle2, Clock, Wallet, Package } from 'lucide-react';
import { PDFDownloadButton } from '@/components/pdf/PDFDownloadButton';
import { PaymentReceiptPDF } from '@/components/pdf/PaymentReceiptPDF';
import { PaymentMode, PaymentReceipt } from '@/types';

// Unified type for items to pay (BR-based or Direct trituration)
interface ItemToPay {
  id: string;
  type: 'br' | 'direct';
  reference: string; // BR number or LOT number
  date: Date;
  clientId: string;
  clientName: string;
  poidsNet?: number; // Only for BR-based
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

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('unpaid');
  const [filterType, setFilterType] = useState<string>('all');

  const [formData, setFormData] = useState({
    modePayment: 'especes' as PaymentMode,
    date: format(new Date(), 'yyyy-MM-dd'),
    observations: '',
  });

  // Build unified list of items to pay (BR-based + Direct triturations)
  const itemsToPay = useMemo(() => {
    const items: ItemToPay[] = [];
    
    // BR-based triturations
    bonsReception
      .filter(br => br.status === 'closed')
      .forEach(br => {
        const trituration = triturations.find(t => t.brId === br.id);
        const client = clients.find(c => c.id === br.clientId);
        
        if (!trituration || !client) return;
        
        // Check if already paid
        const isPaid = paymentReceipts.some(pr => 
          pr.lines.some(line => line.brId === br.id)
        );
        
        // Check if affected to stock
        const isAffectedToStock = stockAffectations.some(sa => sa.brId === br.id);
        
        items.push({
          id: br.id,
          type: 'br',
          reference: br.number,
          date: br.date,
          clientId: br.clientId,
          clientName: client.name,
          poidsNet: br.poidsNet,
          quantiteHuile: trituration.quantiteHuile,
          prixHuileKg: trituration.prixHuileKg,
          isAffectedToStock,
          isPaid,
        });
      });
    
    // Direct triturations
    triturations
      .filter(t => t.type === 'direct' && t.clientId)
      .forEach(trit => {
        const client = clients.find(c => c.id === trit.clientId);
        
        if (!client) return;
        
        // Check if already paid
        const isPaid = paymentReceipts.some(pr => 
          pr.lines.some(line => line.triturationId === trit.id)
        );
        
        // Check if affected to stock
        const isAffectedToStock = stockAffectations.some(sa => sa.triturationId === trit.id);
        
        items.push({
          id: trit.id,
          type: 'direct',
          reference: `LOT-${trit.numeroLot || trit.id.substring(0, 6)}`,
          date: trit.date,
          clientId: trit.clientId!,
          clientName: client.name,
          quantiteHuile: trit.quantiteHuile,
          prixHuileKg: trit.prixHuileKg,
          isAffectedToStock,
          isPaid,
        });
      });
    
    return items;
  }, [bonsReception, triturations, clients, paymentReceipts, stockAffectations]);

  // Filter items: only show items that are affected to stock (with price defined)
  const filteredItems = useMemo(() => {
    return itemsToPay.filter(item => {
      // Only show items that are affected to stock
      if (!item.isAffectedToStock) return false;
      
      if (filterClient !== 'all' && item.clientId !== filterClient) return false;
      if (filterStatus === 'unpaid' && item.isPaid) return false;
      if (filterStatus === 'paid' && !item.isPaid) return false;
      if (filterType !== 'all' && item.type !== filterType) return false;
      return true;
    });
  }, [itemsToPay, filterClient, filterStatus, filterType]);

  // Stats
  const stats = useMemo(() => {
    const affectedItems = itemsToPay.filter(item => item.isAffectedToStock);
    
    return {
      unpaid: affectedItems.filter(item => !item.isPaid).length,
      paid: affectedItems.filter(item => item.isPaid).length,
      totalDecaisse: paymentReceipts.reduce((sum, pr) => sum + pr.totalMontant, 0),
    };
  }, [itemsToPay, paymentReceipts]);

  // Get selected items info
  const selectedItemsInfo = useMemo(() => {
    const selected = filteredItems.filter(item => selectedItems.includes(item.id) && !item.isPaid);
    if (selected.length === 0) return null;
    
    const clientId = selected[0].clientId;
    const allSameClient = selected.every(item => item.clientId === clientId);
    const client = clients.find(c => c.id === clientId);
    
    return {
      count: selected.length,
      allSameClient,
      clientId,
      clientName: client?.name || '',
    };
  }, [selectedItems, filteredItems, clients]);

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const unpaidIds = filteredItems.filter(item => !item.isPaid).map(item => item.id);
      setSelectedItems(unpaidIds);
    } else {
      setSelectedItems([]);
    }
  };

  const openCreateDialog = () => {
    if (!selectedItemsInfo?.allSameClient) {
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
    if (!selectedItemsInfo) return;
    
    // Check all selected items have predefined prices
    const selected = filteredItems.filter(item => selectedItems.includes(item.id) && !item.isPaid);
    const missingPrice = selected.some(item => !item.prixHuileKg || item.prixHuileKg <= 0);
    if (missingPrice) {
      toast({
        title: t("Erreur", "خطأ"),
        description: t("Certains éléments n'ont pas de prix défini. Veuillez affecter l'huile au stock d'abord.", "بعض العناصر ليس لها سعر محدد. يرجى تخصيص الزيت للمخزون أولاً."),
        variant: "destructive",
      });
      return;
    }
    
    // Build items array for the store
    const items = selected.map(item => ({
      type: item.type,
      id: item.id,
    }));
    
    const receipt = addPaymentReceipt({
      clientId: selectedItemsInfo.clientId,
      items,
      modePayment: formData.modePayment,
      date: new Date(formData.date),
      observations: formData.observations || undefined,
    });
    
    if (receipt) {
      toast({
        title: t("Reçu créé", "تم إنشاء الوصل"),
        description: t(`Le reçu ${receipt.number} a été créé avec succès.`, `تم إنشاء الوصل ${receipt.number} بنجاح.`),
      });
      setSelectedItems([]);
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
    if (!selectedItemsInfo) return null;
    
    const selected = filteredItems.filter(item => selectedItems.includes(item.id) && !item.isPaid);
    
    const lines = selected.map(item => {
      const priceUsed = item.prixHuileKg || 0;
      const amount = item.quantiteHuile * priceUsed;
      
      return { reference: item.reference, amount, priceUsed, quantite: item.quantiteHuile, type: item.type };
    });
    
    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    const isValid = selected.every(item => item.prixHuileKg && item.prixHuileKg > 0);
    
    return { lines, total, isValid };
  }, [selectedItems, selectedItemsInfo, filteredItems]);

  // Item columns
  const itemColumns = [
    {
      key: 'select',
      header: () => (
        <Checkbox
          checked={selectedItems.length === filteredItems.filter(item => !item.isPaid).length && filteredItems.some(item => !item.isPaid)}
          onCheckedChange={handleSelectAll}
        />
      ),
      render: (item: ItemToPay) => (
        <Checkbox
          checked={selectedItems.includes(item.id)}
          onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
          disabled={item.isPaid}
        />
      ),
    },
    {
      key: 'type',
      header: t('Type', 'النوع'),
      render: (item: ItemToPay) => (
        <Badge variant={item.type === 'br' ? 'default' : 'secondary'}>
          {item.type === 'br' ? 'BR' : t('Direct', 'مباشر')}
        </Badge>
      ),
    },
    {
      key: 'reference',
      header: t('Référence', 'المرجع'),
      render: (item: ItemToPay) => <span className="font-mono font-medium">{item.reference}</span>,
    },
    {
      key: 'date',
      header: t('Date', 'التاريخ'),
      render: (item: ItemToPay) => format(new Date(item.date), 'dd/MM/yyyy', { locale: dateLocale }),
    },
    {
      key: 'clientName',
      header: t('Client', 'الحريف'),
    },
    {
      key: 'poidsNet',
      header: t('Poids Net (kg)', 'الوزن الصافي (كغ)'),
      render: (item: ItemToPay) => item.poidsNet ? item.poidsNet.toLocaleString() : '-',
    },
    {
      key: 'quantiteHuile',
      header: t('Huile (kg)', 'الزيت (كغ)'),
      render: (item: ItemToPay) => item.quantiteHuile.toLocaleString('fr-FR', { minimumFractionDigits: 3 }),
    },
    {
      key: 'prixHuileKg',
      header: t('Prix/Kg', 'السعر/كغ'),
      render: (item: ItemToPay) => {
        if (item.prixHuileKg) {
          return (
            <span className="font-medium text-primary">
              {item.prixHuileKg.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT
            </span>
          );
        }
        return <span className="text-muted-foreground">-</span>;
      },
    },
    {
      key: 'isPaid',
      header: t('Statut', 'الحالة'),
      render: (item: ItemToPay) => item.isPaid ? (
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
      key: 'lineCount',
      header: t('Nb Éléments', 'عدد العناصر'),
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
    const clientIds = [...new Set(itemsToPay.map(item => item.clientId))];
    return clientIds.map(id => clients.find(c => c.id === id)).filter(Boolean);
  }, [itemsToPay, clients]);

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
          <Label>{t('Type', 'النوع')}:</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Tous", "الكل")}</SelectItem>
              <SelectItem value="br">{t("BR", "وصل")}</SelectItem>
              <SelectItem value="direct">{t("Direct", "مباشر")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
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

        {selectedItems.length > 0 && selectedItemsInfo && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {selectedItems.length} {t('élément(s) sélectionné(s)', 'عنصر محدد')}
              {!selectedItemsInfo.allSameClient && (
                <span className="text-destructive ml-2">({t('clients différents!', 'حرفاء مختلفين!')})</span>
              )}
            </span>
            <Button onClick={openCreateDialog} disabled={!selectedItemsInfo.allSameClient}>
              <Receipt className="h-4 w-4 mr-2" />
              {t('Créer un reçu de règlement', 'إنشاء وصل تسديد')}
            </Button>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          {t('Liste des éléments à payer', 'قائمة العناصر للدفع')}
        </h3>
        <DataTable
          columns={itemColumns}
          data={filteredItems}
          emptyMessage={t("Aucun élément disponible pour paiement", "لا توجد عناصر متاحة للدفع")}
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
          
          {selectedItemsInfo && (
            <div className="space-y-4">
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="font-medium">{selectedItemsInfo.clientName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedItemsInfo.count} {t('élément(s) sélectionné(s)', 'عنصر محدد')}
                </p>
              </div>

              {/* Preview amounts */}
              {previewAmounts && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">{t('Réf.', 'المرجع')}</th>
                        <th className="text-center p-2">{t('Type', 'النوع')}</th>
                        <th className="text-right p-2">{t('Qté (kg)', 'الكمية')}</th>
                        <th className="text-right p-2">{t('P.U.', 'السعر')}</th>
                        <th className="text-right p-2">{t('Montant', 'المبلغ')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewAmounts.lines.map((line, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2 font-mono">{line.reference}</td>
                          <td className="p-2 text-center">
                            <Badge variant={line.type === 'br' ? 'default' : 'secondary'} className="text-xs">
                              {line.type === 'br' ? 'BR' : t('Direct', 'مباشر')}
                            </Badge>
                          </td>
                          <td className="p-2 text-right">{line.quantite.toFixed(3)}</td>
                          <td className="p-2 text-right">{line.priceUsed.toFixed(3)}</td>
                          <td className="p-2 text-right font-medium">{line.amount.toFixed(3)} DT</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted font-semibold">
                      <tr>
                        <td colSpan={4} className="p-2 text-right">{t('Total à payer', 'المبلغ للدفع')}</td>
                        <td className="p-2 text-right">{previewAmounts.total.toFixed(3)} DT</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label>{t('Mode de paiement', 'طريقة الدفع')}</Label>
                  <Select
                    value={formData.modePayment}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, modePayment: v as PaymentMode }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="especes">{t('Espèces', 'نقداً')}</SelectItem>
                      <SelectItem value="virement">{t('Virement', 'تحويل')}</SelectItem>
                      <SelectItem value="compensation">{t('Compensation', 'مقاصة')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>{t('Date du règlement', 'تاريخ الدفع')}</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>{t('Observations', 'ملاحظات')}</Label>
                  <Textarea
                    value={formData.observations}
                    onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('Annuler', 'إلغاء')}
            </Button>
            <Button onClick={handleCreateReceipt} disabled={!previewAmounts?.isValid}>
              <Receipt className="h-4 w-4 mr-2" />
              {t('Créer le reçu', 'إنشاء الوصل')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t('Détails du reçu', 'تفاصيل الوصل')} {selectedReceipt?.number}
            </DialogTitle>
          </DialogHeader>
          
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{t('Client', 'الحريف')}</p>
                  <p className="font-medium">{clients.find(c => c.id === selectedReceipt.clientId)?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('Date', 'التاريخ')}</p>
                  <p className="font-medium">{format(new Date(selectedReceipt.date), 'dd/MM/yyyy', { locale: dateLocale })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('Mode de paiement', 'طريقة الدفع')}</p>
                  <p className="font-medium">{paymentModeLabels[selectedReceipt.modePayment]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('Total', 'المجموع')}</p>
                  <p className="font-medium text-primary">{selectedReceipt.totalMontant.toFixed(3)} DT</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">{t('Référence', 'المرجع')}</th>
                      <th className="text-right p-2">{t('Qté Huile', 'كمية الزيت')}</th>
                      <th className="text-right p-2">{t('P.U.', 'السعر')}</th>
                      <th className="text-right p-2">{t('Montant', 'المبلغ')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReceipt.lines.map((line, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2 font-mono">{line.reference}</td>
                        <td className="p-2 text-right">{line.quantiteHuile?.toFixed(3) || '-'} kg</td>
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
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('Observations', 'ملاحظات')}</p>
                  <p>{selectedReceipt.observations}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            {selectedReceipt && getClientForReceipt(selectedReceipt) && (
              <PDFDownloadButton
                document={<PaymentReceiptPDF receipt={selectedReceipt} client={getClientForReceipt(selectedReceipt)!} settings={settings} />}
                fileName={`Recu_${selectedReceipt.number}.pdf`}
                label={t('Télécharger PDF', 'تحميل PDF')}
              />
            )}
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              {t('Fermer', 'إغلاق')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
