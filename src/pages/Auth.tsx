import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';
import { useBackendStore } from '@/store/backendStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, UserPlus, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

const Auth = () => {
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuthStore();
  const { config } = useBackendStore();
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  
  const isApiMode = config.mode === 'api';
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAuthError(null);
    
    try {
      loginSchema.parse(loginForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[String(err.path[0])] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }
    
    const result = await login(loginForm);
    
    if (result.success) {
      toast.success(t('Connexion réussie', 'تم تسجيل الدخول بنجاح'));
      navigate('/');
    } else {
      setAuthError(result.error || 'Échec de connexion');
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAuthError(null);
    
    try {
      registerSchema.parse(registerForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[String(err.path[0])] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }
    
    const result = await register({
      name: registerForm.name,
      email: registerForm.email,
      password: registerForm.password,
    });
    
    if (result.success) {
      toast.success(t('Compte créé avec succès', 'تم إنشاء الحساب بنجاح'));
      navigate('/');
    } else {
      setAuthError(result.error || "Échec d'inscription");
    }
  };
  
  if (!isApiMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <WifiOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="font-serif text-2xl">
              {t('Mode Local', 'الوضع المحلي')}
            </CardTitle>
            <CardDescription>
              {t(
                "L'authentification n'est pas activée en mode local. Configurez un backend pour activer les connexions multi-utilisateurs.",
                'المصادقة غير مفعلة في الوضع المحلي. قم بتكوين الخادم لتفعيل تسجيل الدخول متعدد المستخدمين.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t(
                  'Pour activer l\'authentification, allez dans Paramètres → Backend et configurez votre serveur API.',
                  'لتفعيل المصادقة، اذهب إلى الإعدادات → الخادم وقم بتكوين خادم API الخاص بك.'
                )}
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/')} className="w-full">
                {t('Continuer en mode local', 'المتابعة في الوضع المحلي')}
              </Button>
              <Button variant="outline" onClick={() => navigate('/parametres')} className="w-full">
                {t('Configurer le backend', 'تكوين الخادم')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Wifi className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-serif text-2xl">
            {t('Huilerie Moderne', 'المعصرة الحديثة')}
          </CardTitle>
          <CardDescription>
            {t('Connectez-vous pour accéder à votre espace', 'سجل دخولك للوصول إلى حسابك')}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="gap-2">
                <LogIn className="h-4 w-4" />
                {t('Connexion', 'تسجيل الدخول')}
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2">
                <UserPlus className="h-4 w-4" />
                {t('Inscription', 'إنشاء حساب')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('Email', 'البريد الإلكتروني')}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="email@exemple.com"
                    disabled={isLoading}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t('Mot de passe', 'كلمة المرور')}</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('Connexion...', 'جاري تسجيل الدخول...')}
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      {t('Se connecter', 'تسجيل الدخول')}
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">{t('Nom complet', 'الاسم الكامل')}</Label>
                  <Input
                    id="register-name"
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    placeholder={t('Votre nom', 'اسمك')}
                    disabled={isLoading}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-email">{t('Email', 'البريد الإلكتروني')}</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="email@exemple.com"
                    disabled={isLoading}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password">{t('Mot de passe', 'كلمة المرور')}</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-confirm">{t('Confirmer le mot de passe', 'تأكيد كلمة المرور')}</Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('Création...', 'جاري الإنشاء...')}
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {t("S'inscrire", 'إنشاء حساب')}
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground text-center">
            {t(
              'Serveur API: ',
              'خادم API: '
            )}
            <span className="font-mono">{config.apiUrl}</span>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
