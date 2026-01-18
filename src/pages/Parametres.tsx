import { useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/appStore';
import { useLanguageStore } from '@/store/languageStore';
import { useBackendStore } from '@/store/backendStore';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/apiClient';
import { syncService } from '@/services/syncService';
import { 
  Settings as SettingsIcon, 
  Building2, 
  CreditCard, 
  Server, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Download, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  User,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';

const Parametres = () => {
  const { settings, updateSettings } = useAppStore();
  const { t } = useLanguageStore();
  const { config, updateConfig, setBackendMode, sync } = useBackendStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: settings.companyName,
    address: settings.address || '',
    phone: settings.phone || '',
    defaultPrixFacon: String(settings.defaultPrixFacon),
    defaultPrixBase: String(settings.defaultPrixBase),
  });
  
  const [backendFormData, setBackendFormData] = useState({
    apiUrl: config.apiUrl,
    apiKey: config.apiKey || '',
    syncInterval: String(config.syncInterval),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateSettings({
      companyName: formData.companyName,
      address: formData.address || undefined,
      phone: formData.phone || undefined,
      defaultPrixFacon: Number(formData.defaultPrixFacon),
      defaultPrixBase: Number(formData.defaultPrixBase),
    });

    toast.success(t('Paramètres enregistrés avec succès', 'تم حفظ الإعدادات بنجاح'));
  };
  
  const handleBackendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateConfig({
      apiUrl: backendFormData.apiUrl,
      apiKey: backendFormData.apiKey || undefined,
      syncInterval: Number(backendFormData.syncInterval),
    });
    
    toast.success(t('Configuration backend enregistrée', 'تم حفظ إعدادات الخادم'));
  };
  
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    
    const result = await apiClient.testConnection();
    
    setIsTestingConnection(false);
    setConnectionStatus(result.success ? 'success' : 'error');
    
    if (result.success) {
      toast.success(t('Connexion réussie au serveur', 'تم الاتصال بالخادم بنجاح'));
    } else {
      toast.error(t(`Échec de connexion: ${result.message}`, `فشل الاتصال: ${result.message}`));
    }
  };
  
  const handleSync = async () => {
    setIsSyncing(true);
    
    const result = await syncService.syncPendingChanges();
    
    setIsSyncing(false);
    
    if (result.success) {
      toast.success(t('Synchronisation réussie', 'تمت المزامنة بنجاح'));
    } else {
      toast.error(t(`Erreur de sync: ${result.error}`, `خطأ في المزامنة: ${result.error}`));
    }
  };
  
  const handlePullFromServer = async () => {
    setIsSyncing(true);
    
    const result = await syncService.pullFromServer();
    
    setIsSyncing(false);
    
    if (result.success) {
      toast.success(t('Données récupérées du serveur', 'تم استرجاع البيانات من الخادم'));
    } else {
      toast.error(t(`Erreur: ${result.error}`, `خطأ: ${result.error}`));
    }
  };
  
  const handlePushToServer = async () => {
    setIsSyncing(true);
    
    const result = await syncService.pushToServer();
    
    setIsSyncing(false);
    
    if (result.success) {
      toast.success(t('Données envoyées au serveur', 'تم إرسال البيانات إلى الخادم'));
    } else {
      toast.error(t(`Erreur: ${result.error}`, `خطأ: ${result.error}`));
    }
  };
  
  const handleExportData = () => {
    const data = syncService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `huilerie-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(t('Données exportées avec succès', 'تم تصدير البيانات بنجاح'));
  };
  
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = syncService.importData(content);
      
      if (result.success) {
        toast.success(t('Données importées avec succès', 'تم استيراد البيانات بنجاح'));
      } else {
        toast.error(t(`Erreur: ${result.error}`, `خطأ: ${result.error}`));
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleLogout = async () => {
    await logout();
    toast.success(t('Déconnexion réussie', 'تم تسجيل الخروج'));
  };
  
  const getSyncStatusBadge = () => {
    switch (sync.status) {
      case 'synced':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> {t('Synchronisé', 'متزامن')}</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><AlertCircle className="h-3 w-3 mr-1" /> {t('En attente', 'في الانتظار')} ({sync.pendingChanges})</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="h-3 w-3 mr-1" /> {t('Erreur', 'خطأ')}</Badge>;
      case 'offline':
        return <Badge variant="outline" className="text-gray-600 border-gray-600"><WifiOff className="h-3 w-3 mr-1" /> {t('Hors ligne', 'غير متصل')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <PageHeader 
        title={t('Paramètres', 'الإعدادات')} 
        description={t('Configurez les paramètres de votre huilerie et le backend', 'إعدادات معصرتك والخادم')}
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="h-4 w-4" />
            {t('Général', 'عام')}
          </TabsTrigger>
          <TabsTrigger value="backend" className="gap-2">
            <Server className="h-4 w-4" />
            {t('Backend', 'الخادم')}
          </TabsTrigger>
          {isAuthenticated && (
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" />
              {t('Compte', 'الحساب')}
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="general">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  <Building2 className="h-5 w-5 text-primary" />
                  {t("Informations de l'huilerie", 'معلومات المعصرة')}
                </CardTitle>
                <CardDescription>
                  {t('Informations générales de votre établissement', 'المعلومات العامة لمؤسستك')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">{t("Nom de l'huilerie", 'اسم المعصرة')}</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder={t('Nom de votre huilerie', 'اسم معصرتك')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t('Adresse', 'العنوان')}</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={t('Adresse complète', 'العنوان الكامل')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('Téléphone', 'الهاتف')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t('Numéro de téléphone', 'رقم الهاتف')}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  <CreditCard className="h-5 w-5 text-primary" />
                  {t('Prix par défaut', 'الأسعار الافتراضية')}
                </CardTitle>
                <CardDescription>
                  {t('Ces prix seront utilisés comme valeurs par défaut lors des paiements', 'هذه الأسعار ستستخدم كقيم افتراضية عند الدفع')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="prixFacon">{t("Prix Façon (DT/kg d'olives)", 'سعر الخدمة')}</Label>
                    <Input
                      id="prixFacon"
                      type="number"
                      step="0.01"
                      value={formData.defaultPrixFacon}
                      onChange={(e) => setFormData({ ...formData, defaultPrixFacon: e.target.value })}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("Prix facturé au client par kg d'olives traitées", 'السعر المفوتر للحريف لكل كغ زيتون معالج')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prixBase">{t('Prix Achat à la base (DT/L)', 'سعر الشراء من المصدر')}</Label>
                    <Input
                      id="prixBase"
                      type="number"
                      step="0.01"
                      value={formData.defaultPrixBase}
                      onChange={(e) => setFormData({ ...formData, defaultPrixBase: e.target.value })}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("Prix payé au client par litre d'huile obtenue", 'السعر المدفوع للحريف لكل لتر زيت')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="lg">
                <SettingsIcon className="mr-2 h-4 w-4" />
                {t('Enregistrer les paramètres', 'حفظ الإعدادات')}
              </Button>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="backend">
          <div className="space-y-6 max-w-2xl">
            {/* Mode Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  {config.mode === 'api' ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-muted-foreground" />}
                  {t('Mode de stockage', 'وضع التخزين')}
                </CardTitle>
                <CardDescription>
                  {t('Choisissez comment vos données sont stockées', 'اختر كيفية تخزين بياناتك')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <p className="font-medium">{t('Mode API (Serveur distant)', 'وضع API (خادم بعيد)')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('Synchronisez vos données avec un serveur backend', 'قم بمزامنة بياناتك مع خادم خلفي')}
                    </p>
                  </div>
                  <Switch
                    checked={config.mode === 'api'}
                    onCheckedChange={(checked) => setBackendMode(checked ? 'api' : 'local')}
                  />
                </div>
                
                {config.mode === 'local' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t(
                        'En mode local, vos données sont stockées dans le navigateur. Elles seront perdues si vous effacez les données du navigateur.',
                        'في الوضع المحلي، يتم تخزين بياناتك في المتصفح. ستفقد إذا قمت بمسح بيانات المتصفح.'
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            {/* API Configuration */}
            {config.mode === 'api' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-serif">
                    <Server className="h-5 w-5 text-primary" />
                    {t('Configuration API', 'إعدادات API')}
                  </CardTitle>
                  <CardDescription>
                    {t('Paramètres de connexion au serveur backend', 'إعدادات الاتصال بالخادم الخلفي')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBackendSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiUrl">{t('URL du serveur API', 'عنوان خادم API')}</Label>
                      <Input
                        id="apiUrl"
                        value={backendFormData.apiUrl}
                        onChange={(e) => setBackendFormData({ ...backendFormData, apiUrl: e.target.value })}
                        placeholder="http://localhost:3001/api"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("L'URL de votre serveur backend (ex: https://api.monhuilerie.com/api)", 'عنوان الخادم الخلفي الخاص بك')}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">{t('Clé API (optionnel)', 'مفتاح API (اختياري)')}</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={backendFormData.apiKey}
                        onChange={(e) => setBackendFormData({ ...backendFormData, apiKey: e.target.value })}
                        placeholder="••••••••••••"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="syncInterval">{t('Intervalle de sync (secondes)', 'فترة المزامنة (ثواني)')}</Label>
                      <Input
                        id="syncInterval"
                        type="number"
                        value={backendFormData.syncInterval}
                        onChange={(e) => setBackendFormData({ ...backendFormData, syncInterval: e.target.value })}
                        placeholder="30"
                        min="5"
                        max="300"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="space-y-1">
                        <p className="font-medium">{t('Synchronisation automatique', 'المزامنة التلقائية')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('Sync automatiquement les modifications', 'مزامنة التغييرات تلقائيًا')}
                        </p>
                      </div>
                      <Switch
                        checked={config.autoSync}
                        onCheckedChange={(checked) => updateConfig({ autoSync: checked })}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        {t('Enregistrer', 'حفظ')}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleTestConnection}
                        disabled={isTestingConnection}
                      >
                        {isTestingConnection ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : connectionStatus === 'success' ? (
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                        ) : connectionStatus === 'error' ? (
                          <XCircle className="mr-2 h-4 w-4 text-red-600" />
                        ) : (
                          <Wifi className="mr-2 h-4 w-4" />
                        )}
                        {t('Tester la connexion', 'اختبار الاتصال')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
            
            {/* Sync Status & Actions */}
            {config.mode === 'api' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 font-serif">
                      <RefreshCw className="h-5 w-5 text-primary" />
                      {t('Synchronisation', 'المزامنة')}
                    </CardTitle>
                    {getSyncStatusBadge()}
                  </div>
                  <CardDescription>
                    {sync.lastSync 
                      ? t(`Dernière sync: ${new Date(sync.lastSync).toLocaleString()}`, `آخر مزامنة: ${new Date(sync.lastSync).toLocaleString()}`)
                      : t('Jamais synchronisé', 'لم تتم المزامنة أبدًا')
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleSync} disabled={isSyncing}>
                      {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                      {t('Synchroniser maintenant', 'مزامنة الآن')}
                    </Button>
                    <Button variant="outline" onClick={handlePullFromServer} disabled={isSyncing}>
                      <Download className="mr-2 h-4 w-4" />
                      {t('Récupérer du serveur', 'استرجاع من الخادم')}
                    </Button>
                    <Button variant="outline" onClick={handlePushToServer} disabled={isSyncing}>
                      <Upload className="mr-2 h-4 w-4" />
                      {t('Envoyer au serveur', 'إرسال إلى الخادم')}
                    </Button>
                  </div>
                  
                  {sync.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('Dernière erreur: ', 'آخر خطأ: ')}{sync.errors[sync.errors.length - 1]}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Backup & Restore */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  <Download className="h-5 w-5 text-primary" />
                  {t('Sauvegarde & Restauration', 'النسخ الاحتياطي والاستعادة')}
                </CardTitle>
                <CardDescription>
                  {t('Exportez ou importez vos données localement', 'صدّر أو استورد بياناتك محليًا')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="mr-2 h-4 w-4" />
                    {t('Exporter les données (JSON)', 'تصدير البيانات (JSON)')}
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    {t('Importer des données', 'استيراد البيانات')}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {isAuthenticated && (
          <TabsContent value="account">
            <div className="space-y-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-serif">
                    <User className="h-5 w-5 text-primary" />
                    {t('Mon compte', 'حسابي')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Nom', 'الاسم')}</span>
                      <span className="font-medium">{user?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Email', 'البريد الإلكتروني')}</span>
                      <span className="font-medium">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Rôle', 'الدور')}</span>
                      <Badge variant="outline">{user?.role}</Badge>
                    </div>
                  </div>
                  
                  <Button variant="destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('Se déconnecter', 'تسجيل الخروج')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </MainLayout>
  );
};

export default Parametres;
