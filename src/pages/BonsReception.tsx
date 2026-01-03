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
import { BonReception } from '@/types';
import { Plus, Eye, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDownloadButton } from '@/components/pdf/PDFDownloadButton';
import { BonReceptionPDF } from '@/components/pdf/BonReceptionPDF';

const BonsReception = () => {
  const { clients, bonsReception, addBR, settings } = useAppStore();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      toast.error('Veuillez sélectionner un client | يرجى اختيار حريف');
      return;
    }

    if (!formData.poidsPlein || !formData.poidsVide) {
      toast.error('Les poids sont obligatoires | الأوزان إجبارية');
      return;
    }

    if (poidsNet <= 0) {
      toast.error('Le poids net doit être positif | الوزن الصافي يجب أن يكون موجباً');
      return;
    }

    addBR({
      date: new Date(formData.date),
      clientId: formData.clientId,
      poidsPlein: Number(formData.poidsPlein),
      poidsVide: Number(formData.poidsVide),
      vehicle: formData.vehicle || undefined,
      observations: formData.observations || undefined,
    });

    toast.success('Bon de réception créé avec succès | تم إنشاء وصل الاستلام بنجاح');
    setIsDialogOpen(false);
    resetForm();
  };

  const columns = [
    { 
      key: 'number', 
      header: 'N° BR | رقم الوصل',
      render: (br: BonReception) => (
        <span className="font-medium text-primary">{br.number}</span>
      )
    },
    { 
      key: 'date', 
      header: 'Date | التاريخ',
      render: (br: BonReception) => format(new Date(br.date), 'dd MMM yyyy', { locale: fr })
    },
    { 
      key: 'client', 
      header: 'Client | الحريف',
      render: (br: BonReception) => {
        const client = clients.find(c => c.id === br.clientId);
        return client?.name || '-';
      }
    },
    { 
      key: 'poidsPlein', 
      header: 'Poids Plein | الوزن الكامل',
      render: (br: BonReception) => `${br.poidsPlein.toLocaleString()} kg`
    },
    { 
      key: 'poidsVide', 
      header: 'Poids Vide | الوزن الفارغ',
      render: (br: BonReception) => `${br.poidsVide.toLocaleString()} kg`
    },
    { 
      key: 'poidsNet', 
      header: 'Poids Net | الوزن الصافي',
      render: (br: BonReception) => (
        <span className="font-semibold text-primary">{br.poidsNet.toLocaleString()} kg</span>
      )
    },
    { 
      key: 'status', 
      header: 'Statut | الحالة',
      render: (br: BonReception) => <StatusBadge status={br.status} />
    },
    { 
      key: 'actions', 
      header: 'Actions | إجراءات',
      render: (br: BonReception) => {
        const client = clients.find(c => c.id === br.clientId);
        return (
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); setViewingBR(br); }}
            >
              <Eye className="h-4 w-4" />
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
        title="Bons de Réception | وصولات الاستلام" 
        description="Gérez les entrées d'olives | إدارة استلام الزيتون"
        action={
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau BR | وصل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif">Nouveau Bon de Réception | وصل استلام جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date * | التاريخ *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client * | الحريف *</Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner... | اختر..." />
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
                    <Label htmlFor="poidsPlein">Poids Plein (kg) * | الوزن الكامل *</Label>
                    <Input
                      id="poidsPlein"
                      type="number"
                      value={formData.poidsPlein}
                      onChange={(e) => setFormData({ ...formData, poidsPlein: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="poidsVide">Poids Vide (kg) * | الوزن الفارغ *</Label>
                    <Input
                      id="poidsVide"
                      type="number"
                      value={formData.poidsVide}
                      onChange={(e) => setFormData({ ...formData, poidsVide: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Poids Net (kg) | الوزن الصافي</Label>
                    <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-semibold text-primary">
                      {poidsNet.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle">Véhicule | المركبة</Label>
                  <Input
                    id="vehicle"
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    placeholder="Immatriculation ou description | رقم اللوحة أو الوصف"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observations | ملاحظات</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    placeholder="Notes additionnelles... | ملاحظات إضافية..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler | إلغاء
                  </Button>
                  <Button type="submit">Créer le BR | إنشاء الوصل</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {clients.length === 0 && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning">
          <p className="text-sm font-medium">
            Aucun client enregistré. Veuillez d'abord créer des clients avant de créer des bons de réception. | لا يوجد حرفاء مسجلين. يرجى إنشاء حرفاء أولاً.
          </p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={[...bonsReception].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )}
        emptyMessage="Aucun bon de réception. Cliquez sur 'Nouveau BR' pour commencer. | لا توجد وصولات استلام"
      />

      {/* View BR Dialog */}
      <Dialog open={!!viewingBR} onOpenChange={() => setViewingBR(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Détails du BR | تفاصيل الوصل {viewingBR?.number}
            </DialogTitle>
          </DialogHeader>
          {viewingBR && (() => {
            const client = clients.find(c => c.id === viewingBR.clientId);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date | التاريخ</p>
                    <p className="font-medium">{format(new Date(viewingBR.date), 'dd MMMM yyyy', { locale: fr })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Statut | الحالة</p>
                    <StatusBadge status={viewingBR.status} />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Client | الحريف</p>
                    <p className="font-medium">{client?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Véhicule | المركبة</p>
                    <p className="font-medium">{viewingBR.vehicle || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Poids Plein | الوزن الكامل</p>
                    <p className="font-medium">{viewingBR.poidsPlein.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Poids Vide | الوزن الفارغ</p>
                    <p className="font-medium">{viewingBR.poidsVide.toLocaleString()} kg</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Poids Net | الوزن الصافي</p>
                    <p className="text-2xl font-semibold text-primary">{viewingBR.poidsNet.toLocaleString()} kg</p>
                  </div>
                </div>
                {viewingBR.observations && (
                  <div>
                    <p className="text-muted-foreground text-sm">Observations | ملاحظات</p>
                    <p className="text-sm">{viewingBR.observations}</p>
                  </div>
                )}
                {client && (
                  <div className="pt-4 border-t">
                    <PDFDownloadButton
                      document={<BonReceptionPDF br={viewingBR} client={client} settings={settings} />}
                      fileName={`${viewingBR.number}.pdf`}
                      label="Télécharger le PDF | تحميل PDF"
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