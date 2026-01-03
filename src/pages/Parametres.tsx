import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/appStore';
import { Settings as SettingsIcon, Building2, CreditCard, Percent } from 'lucide-react';
import { toast } from 'sonner';

const Parametres = () => {
  const { settings, updateSettings } = useAppStore();
  const [formData, setFormData] = useState({
    companyName: settings.companyName,
    address: settings.address || '',
    phone: settings.phone || '',
    defaultPrixFacon: String(settings.defaultPrixFacon),
    defaultPrixBase: String(settings.defaultPrixBase),
    partHuilerieBawaza: String(settings.partHuilerieBawaza),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateSettings({
      companyName: formData.companyName,
      address: formData.address || undefined,
      phone: formData.phone || undefined,
      defaultPrixFacon: Number(formData.defaultPrixFacon),
      defaultPrixBase: Number(formData.defaultPrixBase),
      partHuilerieBawaza: Number(formData.partHuilerieBawaza),
    });

    toast.success('Paramètres enregistrés avec succès | تم حفظ الإعدادات بنجاح');
  };

  return (
    <MainLayout>
      <PageHeader 
        title="Paramètres | الإعدادات" 
        description="Configurez les paramètres de votre huilerie | إعدادات معصرتك"
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <Building2 className="h-5 w-5 text-primary" />
              Informations de l'huilerie | معلومات المعصرة
            </CardTitle>
            <CardDescription>
              Informations générales de votre établissement | المعلومات العامة لمؤسستك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'huilerie | اسم المعصرة</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Nom de votre huilerie | اسم معصرتك"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse | العنوان</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adresse complète | العنوان الكامل"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone | الهاتف</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Numéro de téléphone | رقم الهاتف"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <CreditCard className="h-5 w-5 text-primary" />
              Prix par défaut | الأسعار الافتراضية
            </CardTitle>
            <CardDescription>
              Ces prix seront utilisés comme valeurs par défaut lors des paiements | هذه الأسعار ستستخدم كقيم افتراضية عند الدفع
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prixFacon">Prix Façon (DT/kg d'olives) | سعر الخدمة</Label>
                <Input
                  id="prixFacon"
                  type="number"
                  step="0.01"
                  value={formData.defaultPrixFacon}
                  onChange={(e) => setFormData({ ...formData, defaultPrixFacon: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Prix facturé au client par kg d'olives traitées | السعر المفوتر للحريف لكل كغ زيتون معالج
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prixBase">Prix Achat à la base (DT/L) | سعر الشراء من المصدر</Label>
                <Input
                  id="prixBase"
                  type="number"
                  step="0.01"
                  value={formData.defaultPrixBase}
                  onChange={(e) => setFormData({ ...formData, defaultPrixBase: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Prix payé au client par litre d'huile obtenue | السعر المدفوع للحريف لكل لتر زيت
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bawaza Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <Percent className="h-5 w-5 text-primary" />
              Paramètres Bawaza | إعدادات باوازا
            </CardTitle>
            <CardDescription>
              Configuration du partage de l'huile pour les transactions Bawaza | إعدادات تقاسم الزيت لمعاملات باوازا
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="partBawaza">Part de l'huilerie (%) | حصة المعصرة (%)</Label>
              <Input
                id="partBawaza"
                type="number"
                min="0"
                max="100"
                value={formData.partHuilerieBawaza}
                onChange={(e) => setFormData({ ...formData, partHuilerieBawaza: e.target.value })}
                placeholder="20"
              />
              <p className="text-xs text-muted-foreground">
                Pourcentage de l'huile produite qui revient à l'huilerie (le reste revient au client) | نسبة الزيت المنتج التي تعود للمعصرة (الباقي للحريف)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Enregistrer les paramètres | حفظ الإعدادات
          </Button>
        </div>
      </form>
    </MainLayout>
  );
};

export default Parametres;