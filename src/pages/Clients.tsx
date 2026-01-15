import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useLanguageStore } from '@/store/languageStore';
import { Client, ClientGros, ClientGrosType } from '@/types';
import { Plus, Pencil, Trash2, FileText, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { ClientFicheDialog } from '@/components/clients/ClientFicheDialog';
import { ClientGrosFicheDialog } from '@/components/clients/ClientGrosFicheDialog';
import { PDFDownloadButton } from '@/components/pdf/PDFDownloadButton';
import { AllClientsExtraitPDF } from '@/components/pdf/AllClientsExtraitPDF';
import { AllClientsGrosExtraitPDF } from '@/components/pdf/AllClientsGrosExtraitPDF';

const Clients = () => {
  const { 
    clients, clientsGros, clientOperations, bonsReception, bonsLivraison, paymentReceipts, settings, 
    addClient, updateClient, deleteClient,
    addClientGros, updateClientGros, deleteClientGros 
  } = useAppStore();
  const { t, language } = useLanguageStore();
  
  const [activeTab, setActiveTab] = useState('detail');
  
  // Client Détail state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [ficheClient, setFicheClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cin: '',
    ville: '',
    observations: '',
  });

  // Client Gros state
  const [isGrosDialogOpen, setIsGrosDialogOpen] = useState(false);
  const [editingClientGros, setEditingClientGros] = useState<ClientGros | null>(null);
  const [ficheClientGros, setFicheClientGros] = useState<ClientGros | null>(null);
  const [formDataGros, setFormDataGros] = useState({
    raisonSociale: '',
    clientType: 'grossiste' as ClientGrosType,
    phone: '',
    email: '',
    matriculeFiscal: '',
    adresse: '',
    conditionsPaiement: '',
    observations: '',
  });

  const clientGrosTypeLabels: Record<ClientGrosType, string> = {
    grossiste: t('Grossiste', 'تاجر جملة'),
    exportateur: t('Exportateur', 'مصدّر'),
    societe: t('Société', 'شركة'),
    autre: t('Autre', 'آخر'),
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      cin: '',
      ville: '',
      observations: '',
    });
    setEditingClient(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error(t('Le nom du client est obligatoire', 'اسم الحريف إجباري'));
      return;
    }

    if (editingClient) {
      updateClient(editingClient.id, formData);
      toast.success(t('Client modifié avec succès', 'تم تعديل الحريف بنجاح'));
    } else {
      addClient(formData);
      toast.success(t('Client ajouté avec succès', 'تم إضافة الحريف بنجاح'));
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || '',
      cin: client.cin || '',
      ville: client.ville || '',
      observations: client.observations || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    if (confirm(t(`Êtes-vous sûr de vouloir supprimer le client "${client.name}" ?`, `هل أنت متأكد من حذف الحريف "${client.name}"؟`))) {
      deleteClient(client.id);
      toast.success(t('Client supprimé avec succès', 'تم حذف الحريف بنجاح'));
    }
  };

  // ===== Client Gros Functions =====
  const resetFormGros = () => {
    setFormDataGros({
      raisonSociale: '',
      clientType: 'grossiste',
      phone: '',
      email: '',
      matriculeFiscal: '',
      adresse: '',
      conditionsPaiement: '',
      observations: '',
    });
    setEditingClientGros(null);
  };

  const handleSubmitGros = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formDataGros.raisonSociale.trim()) {
      toast.error(t('La raison sociale est obligatoire', 'الاسم التجاري إجباري'));
      return;
    }

    if (editingClientGros) {
      updateClientGros(editingClientGros.id, formDataGros);
      toast.success(t('Client modifié avec succès', 'تم تعديل الحريف بنجاح'));
    } else {
      addClientGros(formDataGros);
      toast.success(t('Client ajouté avec succès', 'تم إضافة الحريف بنجاح'));
    }

    setIsGrosDialogOpen(false);
    resetFormGros();
  };

  const handleEditGros = (client: ClientGros) => {
    setEditingClientGros(client);
    setFormDataGros({
      raisonSociale: client.raisonSociale,
      clientType: client.clientType,
      phone: client.phone || '',
      email: client.email || '',
      matriculeFiscal: client.matriculeFiscal || '',
      adresse: client.adresse || '',
      conditionsPaiement: client.conditionsPaiement || '',
      observations: client.observations || '',
    });
    setIsGrosDialogOpen(true);
  };

  const handleDeleteGros = (client: ClientGros) => {
    if (confirm(t(`Êtes-vous sûr de vouloir supprimer le client "${client.raisonSociale}" ?`, `هل أنت متأكد من حذف الحريف "${client.raisonSociale}"؟`))) {
      deleteClientGros(client.id);
      toast.success(t('Client supprimé avec succès', 'تم حذف الحريف بنجاح'));
    }
  };

  // ===== Totals for Client Détail =====
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

  const allClientsData = clients.map(client => {
    const totals = getClientTotals(client.id);
    return {
      name: client.name,
      capitalDT: totals.capitalDT,
      avanceDT: totals.avanceDT,
      totalPayments: totals.totalPayments,
    };
  });

  // ===== Data for AllClientsGros PDF =====
  const allClientsGrosData = clientsGros.map(client => {
    const clientBLs = bonsLivraison.filter(bl => bl.clientId === client.id);
    const totalQuantite = clientBLs.reduce((sum, bl) => sum + bl.quantite, 0);
    const totalTTC = clientBLs.reduce((sum, bl) => sum + bl.montantTTC, 0);
    const totalPaye = clientBLs.filter(bl => bl.paymentStatus === 'paye').reduce((sum, bl) => sum + bl.montantTTC, 0);
    const totalEnAttente = clientBLs.filter(bl => bl.paymentStatus === 'en_attente').reduce((sum, bl) => sum + bl.montantTTC, 0);
    
    return {
      code: client.code,
      raisonSociale: client.raisonSociale,
      clientType: client.clientType,
      nbBL: clientBLs.length,
      totalQuantite,
      totalTTC,
      totalPaye,
      totalEnAttente,
    };
  });

  // ===== Columns for Client Détail =====
  const columnsDetail = [
    { 
      key: 'code', 
      header: t('Code', 'الرمز'),
      render: (client: Client) => (
        <span className="font-medium text-primary">{client.code}</span>
      )
    },
    { key: 'name', header: t('Nom / Raison sociale', 'الاسم') },
    { key: 'ville', header: t('Ville', 'المدينة') },
    { 
      key: 'capitalDT', 
      header: t('Capital (DT)', 'رأس المال'),
      render: (client: Client) => {
        const { capitalDT } = getClientTotals(client.id);
        return capitalDT > 0 ? <span className="font-medium">{capitalDT.toFixed(2)}</span> : '-';
      }
    },
    { 
      key: 'avanceDT', 
      header: t('Avance (DT)', 'التسبقة'),
      render: (client: Client) => {
        const { avanceDT } = getClientTotals(client.id);
        return avanceDT > 0 ? <span className="font-medium">{avanceDT.toFixed(2)}</span> : '-';
      }
    },
    { 
      key: 'brKg', 
      header: t('BR (kg)', 'الوصولات'),
      render: (client: Client) => {
        const { brKg } = getClientTotals(client.id);
        return brKg > 0 ? <span className="font-medium">{brKg.toLocaleString()}</span> : '-';
      }
    },
    { 
      key: 'actions', 
      header: t('Actions', 'إجراءات'),
      render: (client: Client) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); setFicheClient(client); }}
            title={t('Voir la fiche', 'عرض البطاقة')}
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

  // ===== Columns for Client Gros =====
  const columnsGros = [
    { 
      key: 'code', 
      header: t('Code', 'الرمز'),
      render: (client: ClientGros) => (
        <span className="font-medium text-primary">{client.code}</span>
      )
    },
    { key: 'raisonSociale', header: t('Raison sociale', 'الاسم التجاري') },
    { 
      key: 'clientType', 
      header: t('Type', 'النوع'),
      render: (client: ClientGros) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
          {clientGrosTypeLabels[client.clientType]}
        </span>
      )
    },
    { key: 'phone', header: t('Téléphone', 'الهاتف') },
    { key: 'email', header: t('Email', 'البريد') },
    { key: 'matriculeFiscal', header: t('Matricule fiscal', 'المعرف الجبائي') },
    { 
      key: 'actions', 
      header: t('Actions', 'إجراءات'),
      render: (client: ClientGros) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); setFicheClientGros(client); }}
            title={t('Voir la fiche', 'عرض البطاقة')}
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); handleEditGros(client); }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); handleDeleteGros(client); }}
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
        title={t('Gestion des Clients', 'إدارة الحرفاء')} 
        description={t('Gérez vos clients détail et gros', 'إدارة حرفاء التفصيل والجملة')}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="detail" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('Vente en Détail', 'بيع بالتفصيل')}
          </TabsTrigger>
          <TabsTrigger value="gros" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t('Vente en Gros', 'بيع بالجملة')}
          </TabsTrigger>
        </TabsList>

        {/* ===== Tab: Client Détail (Trituration) ===== */}
        <TabsContent value="detail" className="mt-6">
          <div className="flex justify-end gap-3 mb-4">
            <PDFDownloadButton
              document={<AllClientsExtraitPDF clients={allClientsData} companyName={settings.companyName} />}
              fileName={`extrait-complet-clients-${new Date().toISOString().split('T')[0]}.pdf`}
              label={t('Générer PDF', 'تحميل PDF')}
              variant="outline"
            />
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('Nouveau Client', 'حريف جديد')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif">
                    {editingClient ? t('Modifier le client', 'تعديل الحريف') : t('Nouveau client', 'حريف جديد')}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('Nom / Raison sociale *', 'الاسم *')}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('Entrez le nom du client', 'أدخل اسم الحريف')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('Téléphone', 'الهاتف')}</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={t('Numéro', 'الرقم')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cin">{t('CIN / Matricule', 'رقم الهوية')}</Label>
                      <Input
                        id="cin"
                        value={formData.cin}
                        onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                        placeholder={t('Optionnel', 'اختياري')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ville">{t('Ville / Délégation', 'المدينة / المعتمدية')}</Label>
                    <Input
                      id="ville"
                      value={formData.ville}
                      onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                      placeholder={t('Ex: Sfax, Sousse...', 'مثال: صفاقس، سوسة...')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observations">{t('Observations', 'ملاحظات')}</Label>
                    <Textarea
                      id="observations"
                      value={formData.observations}
                      onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                      placeholder={t('Notes additionnelles...', 'ملاحظات إضافية...')}
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {t('Annuler', 'إلغاء')}
                    </Button>
                    <Button type="submit">
                      {editingClient ? t('Enregistrer', 'حفظ') : t('Créer', 'إنشاء')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <DataTable
            columns={columnsDetail}
            data={clients}
            emptyMessage={t("Aucun client enregistré. Cliquez sur 'Nouveau Client' pour commencer.", 'لا يوجد حرفاء مسجلين')}
          />
        </TabsContent>

        {/* ===== Tab: Client Gros (Vente en Gros) ===== */}
        <TabsContent value="gros" className="mt-6">
          <div className="flex justify-end gap-3 mb-4">
            <PDFDownloadButton
              document={<AllClientsGrosExtraitPDF clients={allClientsGrosData} companyName={settings.companyName} />}
              fileName={`extrait-ventes-gros-${new Date().toISOString().split('T')[0]}.pdf`}
              label={t('Générer PDF', 'تحميل PDF')}
              variant="outline"
            />
            <Dialog open={isGrosDialogOpen} onOpenChange={(open) => { setIsGrosDialogOpen(open); if (!open) resetFormGros(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('Nouveau Client Gros', 'حريف جملة جديد')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-serif">
                    {editingClientGros ? t('Modifier le client', 'تعديل الحريف') : t('Nouveau client gros', 'حريف جملة جديد')}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitGros} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="raisonSociale">{t('Raison sociale *', 'الاسم التجاري *')}</Label>
                    <Input
                      id="raisonSociale"
                      value={formDataGros.raisonSociale}
                      onChange={(e) => setFormDataGros({ ...formDataGros, raisonSociale: e.target.value })}
                      placeholder={t('Nom de la société', 'اسم الشركة')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientTypeGros">{t('Type *', 'النوع *')}</Label>
                    <Select
                      value={formDataGros.clientType}
                      onValueChange={(value: ClientGrosType) => 
                        setFormDataGros({ ...formDataGros, clientType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grossiste">{t('Grossiste', 'تاجر جملة')}</SelectItem>
                        <SelectItem value="exportateur">{t('Exportateur', 'مصدّر')}</SelectItem>
                        <SelectItem value="societe">{t('Société', 'شركة')}</SelectItem>
                        <SelectItem value="autre">{t('Autre', 'آخر')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneGros">{t('Téléphone', 'الهاتف')}</Label>
                      <Input
                        id="phoneGros"
                        value={formDataGros.phone}
                        onChange={(e) => setFormDataGros({ ...formDataGros, phone: e.target.value })}
                        placeholder={t('Numéro', 'الرقم')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('Email', 'البريد الإلكتروني')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formDataGros.email}
                        onChange={(e) => setFormDataGros({ ...formDataGros, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="matriculeFiscal">{t('Matricule fiscal', 'المعرف الجبائي')}</Label>
                    <Input
                      id="matriculeFiscal"
                      value={formDataGros.matriculeFiscal}
                      onChange={(e) => setFormDataGros({ ...formDataGros, matriculeFiscal: e.target.value })}
                      placeholder={t('Ex: 123456789ABC000', 'مثال: 123456789ABC000')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adresse">{t('Adresse', 'العنوان')}</Label>
                    <Textarea
                      id="adresse"
                      value={formDataGros.adresse}
                      onChange={(e) => setFormDataGros({ ...formDataGros, adresse: e.target.value })}
                      placeholder={t('Adresse complète...', 'العنوان الكامل...')}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conditionsPaiement">{t('Conditions de paiement', 'شروط الدفع')}</Label>
                    <Input
                      id="conditionsPaiement"
                      value={formDataGros.conditionsPaiement}
                      onChange={(e) => setFormDataGros({ ...formDataGros, conditionsPaiement: e.target.value })}
                      placeholder={t('Ex: 30 jours, comptant...', 'مثال: 30 يوم، نقدي...')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observationsGros">{t('Observations', 'ملاحظات')}</Label>
                    <Textarea
                      id="observationsGros"
                      value={formDataGros.observations}
                      onChange={(e) => setFormDataGros({ ...formDataGros, observations: e.target.value })}
                      placeholder={t('Notes additionnelles...', 'ملاحظات إضافية...')}
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsGrosDialogOpen(false)}>
                      {t('Annuler', 'إلغاء')}
                    </Button>
                    <Button type="submit">
                      {editingClientGros ? t('Enregistrer', 'حفظ') : t('Créer', 'إنشاء')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <DataTable
            columns={columnsGros}
            data={clientsGros}
            emptyMessage={t("Aucun client gros enregistré. Cliquez sur 'Nouveau Client Gros' pour commencer.", 'لا يوجد حرفاء جملة مسجلين')}
          />
        </TabsContent>
      </Tabs>

      {ficheClient && (
        <ClientFicheDialog
          client={ficheClient}
          open={!!ficheClient}
          onOpenChange={(open) => !open && setFicheClient(null)}
        />
      )}

      {ficheClientGros && (
        <ClientGrosFicheDialog
          client={ficheClientGros}
          open={!!ficheClientGros}
          onOpenChange={(open) => !open && setFicheClientGros(null)}
        />
      )}
    </MainLayout>
  );
};

export default Clients;