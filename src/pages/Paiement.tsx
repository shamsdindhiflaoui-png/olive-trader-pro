import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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
import { useToast } from '@/hooks/use-toast';
import { Receipt, FileText, CheckCircle2, Clock, CreditCard, Wallet, ArrowRightLeft, Download } from 'lucide-react';
import { PDFDownloadButton } from '@/components/pdf/PDFDownloadButton';
import { PaymentReceiptPDF } from '@/components/pdf/PaymentReceiptPDF';
import { TransactionType, PaymentMode, PaymentReceipt } from '@/types';

interface BRToPay {
  id: string;
  brNumber: string;
  brDate: Date;
  clientId: string;
  clientName: string;
  transactionType: TransactionType;
  poidsNet: number;
  quantiteHuile: number;
  isPaid: boolean;
}

const transactionTypeLabels: Record<TransactionType, string> = {
  facon: 'Façon | خدمة',
  bawaza: 'Bawaza | باوازا',
  achat_base: 'Achat Base | شراء',
};

const paymentModeLabels: Record<PaymentMode, string> = {
  especes: 'Espèces | نقداً',
  virement: 'Virement | تحويل',
  compensation: 'Compensation | مقاصة',
};

export default function Paiement() {
  const { bonsReception, triturations, clients, paymentReceipts, settings, addPaymentReceipt } = useAppStore();

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
        
        if (!trituration || !client) return null;
        
        return {
          id: br.id,
          brNumber: br.number,
          brDate: br.date,
          clientId: br.clientId,
          clientName: client.name,
          transactionType: client.transactionType,
          poidsNet: br.poidsNet,
          quantiteHuile: trituration.quantiteHuile,
          isPaid,
        } as BRToPay;
      })
      .filter(Boolean) as BRToPay[];
  }, [bonsReception, triturations, clients, paymentReceipts]);

  // Filter BRs
  const filteredBRs = useMemo(() => {
    return brsWithTrituration.filter(br => {
      if (filterClient !== 'all' && br.clientId !== filterClient) return false;
      if (filterStatus === 'unpaid' && br.isPaid) return false;
      if (filterStatus === 'paid' && !br.isPaid) return false;
      return true;
    });
  }, [brsWithTrituration, filterClient, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const unpaidBRs = brsWithTrituration.filter(br => !br.isPaid);
    const paidBRs = brsWithTrituration.filter(br => br.isPaid);
    const totalReceipts = paymentReceipts.length;
    const totalPaid = paymentReceipts.reduce((sum, pr) => sum + pr.totalMontant, 0);
    
    return {
      unpaidCount: unpaidBRs.length,
      paidCount: paidBRs.length,
      totalReceipts,
      totalPaid,
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
      transactionType: client?.transactionType || 'facon',
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
        title: "Erreur | خطأ",
        description: "Impossible de mélanger des clients différents dans un même reçu. | لا يمكن خلط حرفاء مختلفين",
        variant: "destructive",
      });
      return;
    }
    
    // Set default price based on transaction type
    const defaultPrice = selectedBRsInfo.transactionType === 'facon' 
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
    
    if (formData.prixUnitaire <= 0) {
      toast({
        title: "Erreur | خطأ",
        description: "Le prix unitaire est obligatoire. | السعر الوحدوي إجباري",
        variant: "destructive",
      });
      return;
    }
    
    const receipt = addPaymentReceipt({
      clientId: selectedBRsInfo.clientId,
      brIds: selectedBRs,
      prixUnitaire: formData.prixUnitaire,
      modePayment: formData.modePayment,
      date: new Date(formData.date),
      observations: formData.observations || undefined,
    });
    
    if (receipt) {
      toast({
        title: "Reçu créé | تم إنشاء الوصل",
        description: `Le reçu ${receipt.number} a été créé avec succès. | تم إنشاء الوصل بنجاح`,
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
        title: "Erreur | خطأ",
        description: "Impossible de créer le reçu. Vérifiez les données. | تعذر إنشاء الوصل",
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
    if (!selectedBRsInfo || formData.prixUnitaire <= 0) return null;
    
    const selectedItems = filteredBRs.filter(br => selectedBRs.includes(br.id) && !br.isPaid);
    
    const lines = selectedItems.map(br => {
      const amount = selectedBRsInfo.transactionType === 'facon'
        ? br.poidsNet * formData.prixUnitaire
        : br.quantiteHuile * formData.prixUnitaire;
      return { brNumber: br.brNumber, amount };
    });
    
    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    
    return { lines, total };
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
      header: 'N° BR | رقم الوصل',
      render: (br: BRToPay) => <span className="font-mono font-medium">{br.brNumber}</span>,
    },
    {
      key: 'brDate',
      header: 'Date BR | التاريخ',
      render: (br: BRToPay) => format(new Date(br.brDate), 'dd/MM/yyyy', { locale: fr }),
    },
    {
      key: 'clientName',
      header: 'Client | الحريف',
    },
    {
      key: 'transactionType',
      header: 'Nature | النوع',
      render: (br: BRToPay) => (
        <Badge variant="outline">{transactionTypeLabels[br.transactionType]}</Badge>
      ),
    },
    {
      key: 'poidsNet',
      header: 'Poids Net (kg) | الوزن الصافي',
      render: (br: BRToPay) => br.poidsNet.toLocaleString(),
    },
    {
      key: 'quantiteHuile',
      header: 'Huile (L) | الزيت',
      render: (br: BRToPay) => br.quantiteHuile.toLocaleString(),
    },
    {
      key: 'isPaid',
      header: 'Statut | الحالة',
      render: (br: BRToPay) => br.isPaid ? (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Payé | مدفوع
        </Badge>
      ) : (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Non payé | غير مدفوع
        </Badge>
      ),
    },
  ];

  // Receipt columns
  const receiptColumns = [
    {
      key: 'number',
      header: 'N° Reçu | رقم الوصل',
      render: (r: PaymentReceipt) => <span className="font-mono font-medium">{r.number}</span>,
    },
    {
      key: 'date',
      header: 'Date | التاريخ',
      render: (r: PaymentReceipt) => format(new Date(r.date), 'dd/MM/yyyy', { locale: fr }),
    },
    {
      key: 'client',
      header: 'Client | الحريف',
      render: (r: PaymentReceipt) => {
        const client = clients.find(c => c.id === r.clientId);
        return client?.name || '-';
      },
    },
    {
      key: 'brCount',
      header: 'Nb BR | عدد الوصولات',
      render: (r: PaymentReceipt) => r.lines.length,
    },
    {
      key: 'totalMontant',
      header: 'Montant Total | المبلغ الإجمالي',
      render: (r: PaymentReceipt) => `${r.totalMontant.toFixed(3)} DT`,
    },
    {
      key: 'modePayment',
      header: 'Mode | الطريقة',
      render: (r: PaymentReceipt) => (
        <Badge variant="outline">{paymentModeLabels[r.modePayment]}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions | إجراءات',
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
        title="Paiement | الدفع"
        description="Gestion des règlements des bons de réception | إدارة تسديد وصولات الاستلام"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="BR Non Payés | غير مدفوعة"
          value={stats.unpaidCount}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="BR Payés | مدفوعة"
          value={stats.paidCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          title="Reçus Émis | الوصولات الصادرة"
          value={stats.totalReceipts}
          icon={<Receipt className="h-5 w-5" />}
        />
        <StatCard
          title="Total Réglé | إجمالي المدفوع"
          value={`${stats.totalPaid.toFixed(3)} DT`}
          icon={<Wallet className="h-5 w-5" />}
        />
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Label>Client | الحريف:</Label>
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tous | الكل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients | كل الحرفاء</SelectItem>
              {uniqueClients.map(client => client && (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Label>Statut | الحالة:</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous | الكل</SelectItem>
              <SelectItem value="unpaid">Non payés | غير مدفوعة</SelectItem>
              <SelectItem value="paid">Payés | مدفوعة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        {selectedBRs.length > 0 && selectedBRsInfo && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {selectedBRs.length} BR sélectionné(s) | محدد
              {!selectedBRsInfo.allSameClient && (
                <span className="text-destructive ml-2">(clients différents! | حرفاء مختلفين!)</span>
              )}
            </span>
            <Button onClick={openCreateDialog} disabled={!selectedBRsInfo.allSameClient}>
              <Receipt className="h-4 w-4 mr-2" />
              Créer un reçu de règlement | إنشاء وصل تسديد
            </Button>
          </div>
        )}
      </div>

      {/* BR List */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Liste des BR à payer | قائمة الوصولات للدفع</h3>
        <DataTable
          columns={brColumns}
          data={filteredBRs}
          emptyMessage="Aucun BR fermé disponible | لا توجد وصولات مغلقة متاحة"
        />
      </div>


      {/* Receipts History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Historique des reçus | سجل الوصولات</h3>
        <DataTable
          columns={receiptColumns}
          data={paymentReceipts}
          emptyMessage="Aucun reçu de règlement | لا توجد وصولات تسديد"
        />
      </div>

      {/* Create Receipt Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un reçu de règlement | إنشاء وصل تسديد</DialogTitle>
          </DialogHeader>
          
          {selectedBRsInfo && (
            <div className="space-y-4">
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="font-medium">{selectedBRsInfo.clientName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedBRs.length} BR sélectionné(s) | محدد - {transactionTypeLabels[selectedBRsInfo.transactionType]}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    {selectedBRsInfo.transactionType === 'facon' 
                      ? 'Prix trituration (DT/kg) | سعر العصر' 
                      : 'Prix de base (DT/L) | السعر الأساسي'}
                  </Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.prixUnitaire}
                    onChange={(e) => setFormData(prev => ({ ...prev, prixUnitaire: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Date de règlement | تاريخ التسديد</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Mode de règlement | طريقة الدفع</Label>
                <Select value={formData.modePayment} onValueChange={(v) => setFormData(prev => ({ ...prev, modePayment: v as PaymentMode }))}>
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

              <div>
                <Label>Observations | ملاحظات</Label>
                <Textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Observations optionnelles... | ملاحظات اختيارية..."
                />
              </div>

              {/* Preview */}
              {previewAmounts && (
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">Aperçu du calcul | معاينة الحساب</h4>
                  {previewAmounts.lines.map((line, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{line.brNumber}</span>
                      <span>{line.amount.toFixed(3)} DT</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total | المجموع</span>
                    <span>{previewAmounts.total.toFixed(3)} DT</span>
                  </div>
                  {selectedBRsInfo.transactionType !== 'facon' && (
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Ce montant sera crédité au compte du client | سيضاف هذا المبلغ لحساب الحريف
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler | إلغاء
            </Button>
            <Button onClick={handleCreateReceipt}>
              Valider le règlement | تأكيد التسديد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du reçu | تفاصيل الوصل</DialogTitle>
          </DialogHeader>
          
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">N° Reçu | رقم الوصل</p>
                  <p className="font-mono font-medium">{selectedReceipt.number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date | التاريخ</p>
                  <p>{format(new Date(selectedReceipt.date), 'dd/MM/yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Client | الحريف</p>
                  <p className="font-medium">
                    {clients.find(c => c.id === selectedReceipt.clientId)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mode de paiement | طريقة الدفع</p>
                  <Badge variant="outline">{paymentModeLabels[selectedReceipt.modePayment]}</Badge>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">BR | الوصل</th>
                      <th className="text-right p-2">Qté | الكمية</th>
                      <th className="text-right p-2">P.U. | السعر</th>
                      <th className="text-right p-2">Montant | المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReceipt.lines.map((line, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2 font-mono">{line.brNumber}</td>
                        <td className="p-2 text-right">
                          {selectedReceipt.transactionType === 'facon' 
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
                      <td colSpan={3} className="p-2 text-right">Total | المجموع</td>
                      <td className="p-2 text-right">{selectedReceipt.totalMontant.toFixed(3)} DT</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedReceipt.observations && (
                <div>
                  <p className="text-muted-foreground text-sm">Observations | ملاحظات</p>
                  <p className="text-sm">{selectedReceipt.observations}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Fermer | إغلاق
            </Button>
            {(() => {
              const client = getClientForReceipt(selectedReceipt);
              return client ? (
                <PDFDownloadButton
                  document={<PaymentReceiptPDF receipt={selectedReceipt} client={client} settings={settings} />}
                  fileName={`Recu_${selectedReceipt.number}.pdf`}
                  label="Télécharger PDF | تحميل PDF"
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