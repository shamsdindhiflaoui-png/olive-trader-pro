import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Client, TransactionType } from '@/types';
import { Plus, Pencil, Trash2, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { ClientFicheDialog } from '@/components/clients/ClientFicheDialog';
import { PDFDownloadButton } from '@/components/pdf/PDFDownloadButton';
import { AllClientsExtraitPDF } from '@/components/pdf/AllClientsExtraitPDF';

const clientTypeLabels: Record<TransactionType, string> = {
  facon: 'Façon (Service)',
  bawaza: 'Bawaza',
  achat_base: 'Achat à la base',
};

const Clients = () => {
  const { clients, clientOperations, bonsReception, paymentReceipts, settings, addClient, updateClient, deleteClient } = useAppStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [ficheClient, setFicheClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    transactionType: 'facon' as TransactionType,
    phone: '',
    observations: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      transactionType: 'facon',
      phone: '',
      observations: '',
    });
    setEditingClient(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Le nom du client est obligatoire');
      return;
    }

    if (editingClient) {
      updateClient(editingClient.id, formData);
      toast.success('Client modifié avec succès');
    } else {
      addClient(formData);
      toast.success('Client ajouté avec succès');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      transactionType: client.transactionType,
      phone: client.phone || '',
      observations: client.observations || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le client "${client.name}" ?`)) {
      deleteClient(client.id);
      toast.success('Client supprimé avec succès');
    }
  };

  // Calculate client totals
  const getClientTotals = (clientId: string) => {
    const ops = clientOperations.filter(op => op.clientId === clientId);
    const brs = bonsReception.filter(br => br.clientId === clientId);
    const receipts = paymentReceipts.filter(r => r.clientId === clientId);
    
    const capitalDT = ops.filter(op => op.type === 'capital_fdr').reduce((sum, op) => sum + (op.montantDT || 0), 0);
    const avanceDT = ops.filter(op => op.type === 'avance').reduce((sum, op) => sum + (op.montantDT || 0), 0);
    const brKg = brs.reduce((sum, br) => sum + br.poidsNet, 0);
    const totalPayments = receipts.reduce((sum, r) => sum + r.totalMontant, 0);
    
    return { capitalDT, avanceDT, brKg, totalPayments };
  };

  // Prepare all clients data for PDF
  const allClientsData = clients.map(client => {
    const totals = getClientTotals(client.id);
    return {
      name: client.name,
      capitalDT: totals.capitalDT,
      avanceDT: totals.avanceDT,
      totalPayments: totals.totalPayments,
    };
  });

  const columns = [
    { 
      key: 'code', 
      header: 'Code',
      render: (client: Client) => (
        <span className="font-medium text-primary">{client.code}</span>
      )
    },
    { key: 'name', header: 'Nom / Raison sociale' },
    { 
      key: 'transactionType', 
      header: 'Type Client',
      render: (client: Client) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
          {clientTypeLabels[client.transactionType]}
        </span>
      )
    },
    { 
      key: 'capitalDT', 
      header: 'Capital (DT)',
      render: (client: Client) => {
        const { capitalDT } = getClientTotals(client.id);
        return capitalDT > 0 ? <span className="font-medium">{capitalDT.toFixed(2)}</span> : '-';
      }
    },
    { 
      key: 'avanceDT', 
      header: 'Avance (DT)',
      render: (client: Client) => {
        const { avanceDT } = getClientTotals(client.id);
        return avanceDT > 0 ? <span className="font-medium">{avanceDT.toFixed(2)}</span> : '-';
      }
    },
    { 
      key: 'brKg', 
      header: 'BR (kg)',
      render: (client: Client) => {
        const { brKg } = getClientTotals(client.id);
        return brKg > 0 ? <span className="font-medium">{brKg.toLocaleString()}</span> : '-';
      }
    },
    { 
      key: 'actions', 
      header: 'Actions',
      render: (client: Client) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); setFicheClient(client); }}
            title="Voir la fiche"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); handleEdit(client); }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); handleDelete(client); }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  return (
    <MainLayout>
      <PageHeader 
        title="Gestion des Clients" 
        description="Gérez votre portefeuille clients"
        action={
          <div className="flex items-center gap-3">
            <PDFDownloadButton
              document={<AllClientsExtraitPDF clients={allClientsData} companyName={settings.companyName} />}
              fileName={`extrait-complet-clients-${new Date().toISOString().split('T')[0]}.pdf`}
              label="Générer l'extrait PDF complet"
              variant="outline"
            />
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif">
                    {editingClient ? 'Modifier le client' : 'Nouveau client'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom / Raison sociale *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Entrez le nom du client"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transactionType">Type Client *</Label>
                    <Select
                      value={formData.transactionType}
                      onValueChange={(value: TransactionType) => 
                        setFormData({ ...formData, transactionType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facon">Façon (Service)</SelectItem>
                        <SelectItem value="bawaza">Bawaza</SelectItem>
                        <SelectItem value="achat_base">Achat à la base</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Numéro de téléphone"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observations">Observations</Label>
                    <Textarea
                      id="observations"
                      value={formData.observations}
                      onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                      placeholder="Notes additionnelles..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingClient ? 'Enregistrer' : 'Créer'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={clients}
        emptyMessage="Aucun client enregistré. Cliquez sur 'Nouveau Client' pour commencer."
      />

      {/* Client Fiche Dialog for all clients */}
      {ficheClient && (
        <ClientFicheDialog
          client={ficheClient}
          open={!!ficheClient}
          onOpenChange={(open) => !open && setFicheClient(null)}
        />
      )}
    </MainLayout>
  );
};

export default Clients;
