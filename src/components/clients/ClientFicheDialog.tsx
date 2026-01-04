import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Client, ClientOperation, ClientOperationType, BonReception, PaymentReceipt } from '@/types';
import { useAppStore } from '@/store/appStore';
import { Plus, Trash2, X, FileDown, ChevronDown, History, Download } from 'lucide-react';
import { toast } from 'sonner';
import { PDFDownloadButton } from '@/components/pdf/PDFDownloadButton';
import { ClientExtraitPDF } from '@/components/pdf/ClientExtraitPDF';
import { CapitalAvanceReceiptPDF } from '@/components/pdf/CapitalAvanceReceiptPDF';

interface ClientFicheDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const operationTypeLabels: Record<ClientOperationType, string> = {
  capital_fdr: 'Capital FDR',
  avance: 'Avance',
  br_reception: 'BR Reçu',
};

const clientTypeLabels: Record<string, string> = {
  agriculteur: 'Agriculteur | فلاح',
  bawaz: 'Bawaz | باواز',
  facon: 'Façon (Service)',
  bawaza: 'Bawaza',
  achat_base: 'Achat à la base',
};

interface TableRow {
  id: string;
  date: Date;
  libelle: string;
  type: ClientOperationType | 'br';
  capitalDT?: number;
  avanceDT?: number;
  brKg?: number;
  huileL?: number;
  isPaid?: boolean;
  reference?: string;
  receiptNumber?: string;
  originalOperation?: ClientOperation;
}

export function ClientFicheDialog({ client, open, onOpenChange }: ClientFicheDialogProps) {
  const { clientOperations, deletedOperations, bonsReception, triturations, paymentReceipts, settings, addClientOperation, deleteClientOperation, getDeletedOperations } = useAppStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newOperation, setNewOperation] = useState({
    type: 'capital_fdr' as ClientOperationType,
    date: format(new Date(), 'yyyy-MM-dd'),
    libelle: '',
    montantDT: '',
    observations: '',
  });

  // Get deleted operations for this client
  const clientDeletedOps = useMemo(() =>
    deletedOperations?.filter(op => op.clientId === client.id) || [],
    [deletedOperations, client.id]
  );

  // Get all operations for this client
  const clientOps = useMemo(() => 
    clientOperations.filter(op => op.clientId === client.id),
    [clientOperations, client.id]
  );

  // Get all BRs for this client
  const clientBRs = useMemo(() => 
    bonsReception.filter(br => br.clientId === client.id),
    [bonsReception, client.id]
  );

  // Get trituration data for BRs (huile quantity)
  const getTriturationForBR = (brId: string) => {
    return triturations.find(t => t.brId === brId);
  };

  // Get payment receipt for BR
  const getPaymentReceiptForBR = (brId: string) => {
    return paymentReceipts.find(pr => pr.lines.some(line => line.brId === brId));
  };

  // Get all payment receipts for this client
  const clientPaymentReceipts = useMemo(() =>
    paymentReceipts.filter(pr => pr.clientId === client.id),
    [paymentReceipts, client.id]
  );

  // Calculate total payments received
  const totalPaymentsReceived = useMemo(() =>
    clientPaymentReceipts.reduce((sum, pr) => sum + pr.totalMontant, 0),
    [clientPaymentReceipts]
  );

  // Combine all data into table rows
  const tableRows = useMemo(() => {
    const rows: TableRow[] = [];

    // Add operations (capital FDR and avances)
    clientOps.forEach(op => {
      rows.push({
        id: op.id,
        date: new Date(op.date),
        libelle: op.libelle,
        type: op.type,
        capitalDT: op.type === 'capital_fdr' ? op.montantDT : undefined,
        avanceDT: op.type === 'avance' ? op.montantDT : undefined,
        brKg: undefined,
        reference: op.reference,
        receiptNumber: op.receiptNumber,
        originalOperation: op,
      });
    });

    // Add BRs
    clientBRs.forEach(br => {
      const trituration = getTriturationForBR(br.id);
      const paymentReceipt = getPaymentReceiptForBR(br.id);
      const isPaid = !!paymentReceipt;
      
      rows.push({
        id: `br-${br.id}`,
        date: new Date(br.date),
        libelle: `Réception olives - ${br.number}`,
        type: 'br',
        capitalDT: undefined,
        avanceDT: undefined,
        brKg: br.poidsNet,
        huileL: trituration?.quantiteHuile || 0,
        isPaid: isPaid,
        reference: br.number,
      });
    });

    // Sort by date
    return rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [clientOps, clientBRs]);

  // Calculate totals
  const totals = useMemo(() => {
    const base = tableRows.reduce(
      (acc, row) => ({
        capitalDT: acc.capitalDT + (row.capitalDT || 0),
        avanceDT: acc.avanceDT + (row.avanceDT || 0),
        brKg: acc.brKg + (row.brKg || 0),
        huileL: acc.huileL + (row.huileL || 0),
        paidKg: acc.paidKg + (row.isPaid ? (row.brKg || 0) : 0),
        unpaidKg: acc.unpaidKg + (!row.isPaid && row.brKg ? (row.brKg || 0) : 0),
      }),
      { capitalDT: 0, avanceDT: 0, brKg: 0, huileL: 0, paidKg: 0, unpaidKg: 0 }
    );
    
    // Calculate balance: (Capital + Avances) - Total Payments Received
    const solde = (base.capitalDT + base.avanceDT) - totalPaymentsReceived;
    
    return { ...base, totalPayments: totalPaymentsReceived, solde };
  }, [tableRows, totalPaymentsReceived]);

  const handleAddOperation = () => {
    if (!newOperation.libelle.trim()) {
      toast.error('Le libellé est obligatoire');
      return;
    }
    if (!newOperation.montantDT || parseFloat(newOperation.montantDT) <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }

    const newOp = addClientOperation({
      clientId: client.id,
      type: newOperation.type,
      date: new Date(newOperation.date),
      libelle: newOperation.libelle.trim(),
      montantDT: parseFloat(newOperation.montantDT),
      observations: newOperation.observations || undefined,
    });

    toast.success(`Opération ajoutée - Reçu: ${newOp.receiptNumber}`);
    setNewOperation({
      type: 'capital_fdr',
      date: format(new Date(), 'yyyy-MM-dd'),
      libelle: '',
      montantDT: '',
      observations: '',
    });
    setShowAddForm(false);
  };

  const handleDeleteOperation = (id: string) => {
    if (id.startsWith('br-')) {
      toast.error('Les BR ne peuvent pas être supprimés depuis cette vue');
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer cette opération ? Elle sera archivée dans l\'historique.')) {
      deleteClientOperation(id, 'Suppression manuelle');
      toast.success('Opération supprimée et archivée dans l\'historique');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Fiche Client - {client.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Info Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Code</p>
              <p className="font-medium">{client.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium text-primary">{clientTypeLabels[client.clientType] || clientTypeLabels[client.transactionType] || client.clientType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Téléphone</p>
              <p className="font-medium">{client.phone || '-'}</p>
            </div>
          </div>

          {/* Add Operation Button */}
          {!showAddForm && (
            <div className="flex justify-end">
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Capital/Avance
              </Button>
            </div>
          )}

          {/* Add Operation Form */}
          {showAddForm && (
            <div className="p-4 border border-border rounded-lg space-y-4 bg-card">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Nouvelle opération</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type d'opération</Label>
                  <Select
                    value={newOperation.type}
                    onValueChange={(value: ClientOperationType) =>
                      setNewOperation({ ...newOperation, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="capital_fdr">Capital FDR</SelectItem>
                      <SelectItem value="avance">Avance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newOperation.date}
                    onChange={(e) => setNewOperation({ ...newOperation, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Libellé *</Label>
                  <Input
                    value={newOperation.libelle}
                    onChange={(e) => setNewOperation({ ...newOperation, libelle: e.target.value })}
                    placeholder={newOperation.type === 'capital_fdr' ? 'Capital de démarrage saison' : 'Avance sur production'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Montant (DT) *</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={newOperation.montantDT}
                    onChange={(e) => setNewOperation({ ...newOperation, montantDT: e.target.value })}
                    placeholder="0.000"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Observations</Label>
                  <Textarea
                    value={newOperation.observations}
                    onChange={(e) => setNewOperation({ ...newOperation, observations: e.target.value })}
                    placeholder="Notes additionnelles..."
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddOperation}>
                  Enregistrer
                </Button>
              </div>
            </div>
          )}

          {/* Operations Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">Date | التاريخ</TableHead>
                  <TableHead>Libellé | البيان</TableHead>
                  <TableHead className="text-right w-[100px]">Capital (DT)</TableHead>
                  <TableHead className="text-right w-[100px]">Avance (DT)</TableHead>
                  <TableHead className="text-right w-[100px]">BR (kg)</TableHead>
                  <TableHead className="text-right w-[100px]">Huile (L)</TableHead>
                  <TableHead className="text-center w-[90px]">État</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune opération enregistrée | لا توجد عمليات
                    </TableCell>
                  </TableRow>
                ) : (
                  tableRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-sm">
                        {format(row.date, 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={row.type === 'br' ? 'text-primary' : ''}>
                            {row.libelle}
                          </span>
                          {row.receiptNumber && (
                            <span className="text-xs text-muted-foreground">
                              {row.receiptNumber}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.capitalDT !== undefined ? `${row.capitalDT.toFixed(3)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.avanceDT !== undefined ? `${row.avanceDT.toFixed(3)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {row.brKg !== undefined ? `${row.brKg.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.huileL !== undefined && row.type === 'br' ? `${row.huileL.toFixed(1)}` : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.type === 'br' ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            row.isPaid 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {row.isPaid ? 'Payé' : 'Non payé'}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {/* PDF Download for Capital/Avance */}
                          {row.originalOperation && row.receiptNumber && (
                            <PDFDownloadButton
                              document={
                                <CapitalAvanceReceiptPDF
                                  operation={row.originalOperation}
                                  client={client}
                                  settings={settings}
                                  receiptNumber={row.receiptNumber}
                                />
                              }
                              fileName={`${row.receiptNumber}.pdf`}
                              label=""
                              variant="ghost"
                              size="sm"
                              icon={<Download className="h-4 w-4" />}
                            />
                          )}
                          {/* Delete button */}
                          {!row.id.startsWith('br-') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteOperation(row.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted font-semibold">
                  <TableCell colSpan={2} className="text-right">
                    TOTAUX
                  </TableCell>
                  <TableCell className="text-right text-lg">
                    {totals.capitalDT.toFixed(3)} DT
                  </TableCell>
                  <TableCell className="text-right text-lg">
                    {totals.avanceDT.toFixed(3)} DT
                  </TableCell>
                  <TableCell className="text-right text-lg text-primary">
                    {totals.brKg.toLocaleString()} kg
                  </TableCell>
                  <TableCell className="text-right text-lg">
                    {totals.huileL.toFixed(1)} L
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow className="bg-green-50 dark:bg-green-900/20">
                  <TableCell colSpan={4} className="text-right font-medium text-green-700 dark:text-green-400">
                    Total Payé
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-700 dark:text-green-400">
                    {totals.paidKg.toLocaleString()} kg
                  </TableCell>
                  <TableCell colSpan={3}></TableCell>
                </TableRow>
                <TableRow className="bg-red-50 dark:bg-red-900/20">
                  <TableCell colSpan={4} className="text-right font-medium text-red-700 dark:text-red-400">
                    Total Non Payé
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-700 dark:text-red-400">
                    {totals.unpaidKg.toLocaleString()} kg
                  </TableCell>
                  <TableCell colSpan={3}></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {/* Tableau récapitulatif */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Capital (DT)</TableHead>
                  <TableHead>Avances (DT)</TableHead>
                  <TableHead>Montant Payé (DT)</TableHead>
                  <TableHead>Solde (DT)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold text-lg">
                    {totals.capitalDT.toFixed(3)}
                  </TableCell>
                  <TableCell className="font-semibold text-lg text-primary">
                    {totals.avanceDT.toFixed(3)}
                  </TableCell>
                  <TableCell className="font-semibold text-lg text-green-600 dark:text-green-400">
                    {totals.totalPayments.toFixed(3)}
                  </TableCell>
                  <TableCell className={`font-bold text-lg ${totals.solde >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {totals.solde >= 0 ? '+' : ''}{totals.solde.toFixed(3)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Historique des suppressions */}
          {clientDeletedOps.length > 0 && (
            <Collapsible open={showHistory} onOpenChange={setShowHistory}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Historique des suppressions | سجل الحذف ({clientDeletedOps.length})
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border border-border rounded-lg overflow-hidden mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-red-50 dark:bg-red-900/20">
                        <TableHead>Date | التاريخ</TableHead>
                        <TableHead>Type | النوع</TableHead>
                        <TableHead>Libellé | البيان</TableHead>
                        <TableHead className="text-right">Montant (DT)</TableHead>
                        <TableHead>N° Reçu</TableHead>
                        <TableHead>Supprimé le</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientDeletedOps.map((op) => (
                        <TableRow key={op.id} className="bg-red-50/50 dark:bg-red-900/10">
                          <TableCell className="text-sm">
                            {format(new Date(op.date), 'dd/MM/yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <span className="text-red-600 dark:text-red-400">
                              {op.type === 'capital_fdr' ? 'Capital FDR' : 'Avance'}
                            </span>
                          </TableCell>
                          <TableCell>{op.libelle}</TableCell>
                          <TableCell className="text-right font-medium text-red-600 dark:text-red-400">
                            {(op.montantDT || 0).toFixed(3)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {op.receiptNumber || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(op.deletedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Bouton Export PDF */}
          <div className="flex justify-end">
            <PDFDownloadButton
              document={
                <ClientExtraitPDF
                  client={client}
                  capitalDT={totals.capitalDT}
                  avanceDT={totals.avanceDT}
                  totalPayments={totals.totalPayments}
                  companyName={settings.companyName}
                />
              }
              fileName={`extrait-${client.code}-${format(new Date(), 'yyyyMMdd')}.pdf`}
              label="Générer l'extrait PDF | توليد مستخرج PDF"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}