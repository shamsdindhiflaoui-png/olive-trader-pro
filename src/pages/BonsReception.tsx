import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
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
import { useLanguageStore } from '@/store/languageStore';
import { BonReception, BRNature } from '@/types';
import { Plus, Eye, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { PDFDownloadButton } from '@/components/pdf/PDFDownloadButton';
import { BonReceptionPDF } from '@/components/pdf/BonReceptionPDF';
import { BREtiquettePDF } from '@/components/pdf/BREtiquettePDF';
import { pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';

const BonsReception = () => {
  const { clients, bonsReception, addBR, settings } = useAppStore();
  const { t, language } = useLanguageStore();
  const dateLocale = language === 'ar' ? ar : fr;
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingBR, setViewingBR] = useState<BonReception | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    clientId: '',
    poidsPlein: '',
    poidsVide: '',
    vehicle: '',
    observations: '',
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      clientId: '',
      poidsPlein: '',
      poidsVide: '',
      vehicle: '',
      observations: '',
    });
  };

  const poidsNet = formData.poidsPlein && formData.poidsVide 
    ? Number(formData.poidsPlein) - Number(formData.poidsVide) 
    : 0;

  const generateQRCode = async (br: BonReception, clientName: string): Promise<string> => {
    const qrData = JSON.stringify({
      br: br.number,
      client: clientName,
      poids: br.poidsNet,
      date: format(br.createdAt, 'dd/MM/yyyy HH:mm:ss'),
      nature: br.nature || 'bawaz'
    });
    return await QRCode.toDataURL(qrData, { 
      width: 120,
      margin: 1,
      errorCorrectionLevel: 'M'
    });
  };

  const downloadEtiquette = async (br: BonReception, clientName: string) => {
    try {
      const qrCodeDataUrl = await generateQRCode(br, clientName);
      const blob = await pdf(
        <BREtiquettePDF
          brNumber={br.number}
          clientName={clientName}
          poidsNet={br.poidsNet}
          date={br.createdAt}
          nature={br.nature || 'bawaz'}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Etiquette-${br.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading etiquette:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      toast.error(t('Veuillez sélectionner un client', 'يرجى اختيار حريف'));
      return;
    }

    if (!formData.poidsPlein || !formData.poidsVide) {
      toast.error(t('Les poids sont obligatoires', 'الأوزان إجبارية'));
      return;
    }

    if (poidsNet <= 0) {
      toast.error(t('Le poids net doit être positif', 'الوزن الصافي يجب أن يكون موجباً'));
      return;
    }

    const newBR = addBR({
      date: new Date(formData.date),
      clientId: formData.clientId,
      nature: 'bawaz',
      poidsPlein: Number(formData.poidsPlein),
      poidsVide: Number(formData.poidsVide),
      vehicle: formData.vehicle || undefined,
      observations: formData.observations || undefined,
    });

    const client = clients.find(c => c.id === formData.clientId);
    const clientName = client?.name || '-';

    // Download etiquette automatically
    await downloadEtiquette(newBR, clientName);

    toast.success(t('BR créé avec succès', 'تم إنشاء الوصل بنجاح'));
    setIsDialogOpen(false);
    resetForm();
  };

  const columns = [
    { 
      key: 'number', 
      header: t('N° BR', 'رقم الوصل'),
      render: (br: BonReception) => (
        <span className="font-medium text-primary">{br.number}</span>
      )
    },
    { 
      key: 'date', 
      header: t('Date', 'التاريخ'),
      render: (br: BonReception) => format(new Date(br.date), 'dd MMM yyyy', { locale: dateLocale })
    },
    { 
      key: 'client', 
      header: t('Client', 'الحريف'),
      render: (br: BonReception) => {
        const client = clients.find(c => c.id === br.clientId);
        return client?.name || '-';
      }
    },
    { 
      key: 'poidsPlein', 
      header: t('Poids Plein', 'الوزن الكامل'),
      render: (br: BonReception) => `${br.poidsPlein.toLocaleString()} kg`
    },
    { 
      key: 'poidsVide', 
      header: t('Poids Vide', 'الوزن الفارغ'),
      render: (br: BonReception) => `${br.poidsVide.toLocaleString()} kg`
    },
    { 
      key: 'poidsNet', 
      header: t('Poids Net', 'الوزن الصافي'),
      render: (br: BonReception) => (
        <span className="font-semibold text-primary">{br.poidsNet.toLocaleString()} kg</span>
      )
    },
    { 
      key: 'status', 
      header: t('Statut', 'الحالة'),
      render: (br: BonReception) => <StatusBadge status={br.status} />
    },
    { 
      key: 'actions', 
      header: t('Actions', 'إجراءات'),
      render: (br: BonReception) => {
        const client = clients.find(c => c.id === br.clientId);
        return (
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); setViewingBR(br); }}
              title={t('Voir', 'عرض')}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => { 
                e.stopPropagation(); 
                downloadEtiquette(br, client?.name || '-'); 
              }}
              title={t('Télécharger étiquette', 'تحميل الملصق')}
            >
              <Printer className="h-4 w-4" />
            </Button>
            {client && (
              <PDFDownloadButton
                document={<BonReceptionPDF br={br} client={client} settings={settings} />}
                fileName={`${br.number}.pdf`}
                label=""
                size="sm"
                variant="ghost"
              />
            )}
          </div>
        );
      }
    },
  ];

  return (
    <MainLayout>
      <PageHeader 
        title={t('Bons de Réception', 'وصولات الاستلام')} 
        description={t("Gérez les entrées d'olives", 'إدارة استلام الزيتون')}
        action={
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('Nouveau BR', 'وصل جديد')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif">{t('Nouveau Bon de Réception', 'وصل استلام جديد')}</DialogTitle>
              </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">{t('Date *', 'التاريخ *')}</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientId">{t('Client *', 'الحريف *')}</Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('Sélectionner...', 'اختر...')} />
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
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="poidsPlein">{t('Poids Plein (kg) *', 'الوزن الكامل *')}</Label>
                    <Input
                      id="poidsPlein"
                      type="number"
                      value={formData.poidsPlein}
                      onChange={(e) => setFormData({ ...formData, poidsPlein: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="poidsVide">{t('Poids Vide (kg) *', 'الوزن الفارغ *')}</Label>
                    <Input
                      id="poidsVide"
                      type="number"
                      value={formData.poidsVide}
                      onChange={(e) => setFormData({ ...formData, poidsVide: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('Poids Net (kg)', 'الوزن الصافي')}</Label>
                    <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-semibold text-primary">
                      {poidsNet.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle">{t('Véhicule', 'المركبة')}</Label>
                  <Input
                    id="vehicle"
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    placeholder={t('Immatriculation ou description', 'رقم اللوحة أو الوصف')}
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

                {/* Aperçu de l'étiquette */}
                {formData.clientId && poidsNet > 0 && (
                  <div className="space-y-2">
                    <Label>{t('Aperçu Étiquette', 'معاينة الملصق')}</Label>
                    <div className="border border-foreground rounded p-2 bg-background" style={{ width: '280px', height: '120px' }}>
                      <div className="border border-foreground h-full p-2 flex flex-col justify-between">
                        <div className="flex justify-between items-start border-b border-foreground pb-1">
                          <span className="font-bold text-sm">BR-XXXX</span>
                          <span className="text-[10px] text-right">
                            {format(new Date(formData.date), 'dd/MM/yyyy')} {format(new Date(), 'HH:mm')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center flex-1 py-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <span className="text-[9px] text-muted-foreground">Client:</span>
                              <p className="font-bold text-xs">{clients.find(c => c.id === formData.clientId)?.name || '-'}</p>
                            </div>
                            <div className="border border-foreground p-1 text-center min-w-[70px]">
                              <span className="text-[8px] block">Poids Net</span>
                              <span className="font-bold text-sm">{poidsNet.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span>
                            </div>
                          </div>
                          <div className="w-8 h-8 border border-foreground flex items-center justify-center text-[6px]">
                            QR
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{t('Format: 70×30mm - Impression N&B', 'الحجم: 70×30 مم - طباعة أبيض وأسود')}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t('Annuler', 'إلغاء')}
                  </Button>
                  <Button type="submit">{t('Créer le BR', 'إنشاء الوصل')}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {clients.length === 0 && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning">
          <p className="text-sm font-medium">
            {t("Aucun client enregistré. Veuillez d'abord créer des clients avant de créer des bons de réception.", 'لا يوجد حرفاء مسجلين. يرجى إنشاء حرفاء أولاً.')}
          </p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={[...bonsReception].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )}
        emptyMessage={t("Aucun bon de réception. Cliquez sur 'Nouveau BR' pour commencer.", 'لا توجد وصولات استلام')}
      />

      {/* View BR Dialog */}
      <Dialog open={!!viewingBR} onOpenChange={() => setViewingBR(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {t('Détails du BR', 'تفاصيل الوصل')} {viewingBR?.number}
            </DialogTitle>
          </DialogHeader>
          {viewingBR && (() => {
            const client = clients.find(c => c.id === viewingBR.clientId);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('Date', 'التاريخ')}</p>
                    <p className="font-medium">{format(new Date(viewingBR.date), 'dd MMMM yyyy', { locale: dateLocale })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('Statut', 'الحالة')}</p>
                    <StatusBadge status={viewingBR.status} />
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('Client', 'الحريف')}</p>
                    <p className="font-medium">{client?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('Date', 'التاريخ')}</p>
                    <p className="font-medium">{format(new Date(viewingBR.date), 'dd MMMM yyyy', { locale: dateLocale })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('Statut', 'الحالة')}</p>
                    <StatusBadge status={viewingBR.status} />
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('Client', 'الحريف')}</p>
                    <p className="font-medium">{client?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('Véhicule', 'المركبة')}</p>
                    <p className="font-medium">{viewingBR.vehicle || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('Poids Plein', 'الوزن الكامل')}</p>
                    <p className="font-medium">{viewingBR.poidsPlein.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('Poids Vide', 'الوزن الفارغ')}</p>
                    <p className="font-medium">{viewingBR.poidsVide.toLocaleString()} kg</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">{t('Poids Net', 'الوزن الصافي')}</p>
                    <p className="text-2xl font-semibold text-primary">{viewingBR.poidsNet.toLocaleString()} kg</p>
                  </div>
                </div>
                {viewingBR.observations && (
                  <div>
                    <p className="text-muted-foreground text-sm">{t('Observations', 'ملاحظات')}</p>
                    <p className="text-sm">{viewingBR.observations}</p>
                  </div>
                )}
                {client && (
                  <div className="pt-4 border-t">
                    <PDFDownloadButton
                      document={<BonReceptionPDF br={viewingBR} client={client} settings={settings} />}
                      fileName={`${viewingBR.number}.pdf`}
                      label={t('Télécharger le PDF', 'تحميل PDF')}
                      variant="default"
                      size="default"
                    />
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default BonsReception;