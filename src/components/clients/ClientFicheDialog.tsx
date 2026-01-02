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
import { Client, ClientOperation, ClientOperationType, BonReception } from '@/types';
import { useAppStore } from '@/store/appStore';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

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

interface TableRow {
  id: string;
  date: Date;
  libelle: string;
  type: ClientOperationType | 'br';
  capitalDT?: number;
  avanceDT?: number;
  brKg?: number;
  reference?: string;
}

export function ClientFicheDialog({ client, open, onOpenChange }: ClientFicheDialogProps) {
  const { clientOperations, bonsReception, addClientOperation, deleteClientOperation } = useAppStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOperation, setNewOperation] = useState({
    type: 'capital_fdr' as ClientOperationType,
    date: format(new Date(), 'yyyy-MM-dd'),
    libelle: '',
    montantDT: '',
    observations: '',
  });

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
      });
    });

    // Add BRs
    clientBRs.forEach(br => {
      rows.push({
        id: `br-${br.id}`,
        date: new Date(br.date),
        libelle: `Réception olives - ${br.number}`,
        type: 'br',
        capitalDT: undefined,
        avanceDT: undefined,
        brKg: br.poidsNet,
        reference: br.number,
      });
    });

    // Sort by date
    return rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [clientOps, clientBRs]);

  // Calculate totals
  const totals = useMemo(() => {
    return tableRows.reduce(
      (acc, row) => ({
        capitalDT: acc.capitalDT + (row.capitalDT || 0),
        avanceDT: acc.avanceDT + (row.avanceDT || 0),
        brKg: acc.brKg + (row.brKg || 0),
      }),
      { capitalDT: 0, avanceDT: 0, brKg: 0 }
    );
  }, [tableRows]);

  const handleAddOperation = () => {
    if (!newOperation.libelle.trim()) {
      toast.error('Le libellé est obligatoire');
      return;
    }
    if (!newOperation.montantDT || parseFloat(newOperation.montantDT) <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }

    addClientOperation({
      clientId: client.id,
      type: newOperation.type,
      date: new Date(newOperation.date),
      libelle: newOperation.libelle.trim(),
      montantDT: parseFloat(newOperation.montantDT),
      observations: newOperation.observations || undefined,
    });

    toast.success('Opération ajoutée avec succès');
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
    if (confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
      deleteClientOperation(id);
      toast.success('Opération supprimée');
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
              <p className="font-medium text-primary">Bawaza</p>
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
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right w-[120px]">Capital (DT)</TableHead>
                  <TableHead className="text-right w-[120px]">Avance (DT)</TableHead>
                  <TableHead className="text-right w-[120px]">BR (kg)</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune opération enregistrée
                    </TableCell>
                  </TableRow>
                ) : (
                  tableRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-sm">
                        {format(row.date, 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <span className={row.type === 'br' ? 'text-primary' : ''}>
                          {row.libelle}
                        </span>
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
                      <TableCell>
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
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-secondary/20 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total Capital FDR</p>
              <p className="text-2xl font-bold text-secondary-foreground">{totals.capitalDT.toFixed(3)} DT</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total Avances</p>
              <p className="text-2xl font-bold text-primary">{totals.avanceDT.toFixed(3)} DT</p>
            </div>
            <div className="p-4 bg-accent/20 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total Olives Reçues</p>
              <p className="text-2xl font-bold text-accent-foreground">{totals.brKg.toLocaleString()} kg</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}