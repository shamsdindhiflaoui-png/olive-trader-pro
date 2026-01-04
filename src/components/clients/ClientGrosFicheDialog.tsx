import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { ClientGros, ClientGrosType, BonLivraison } from '@/types';
import { useAppStore } from '@/store/appStore';
import { useLanguageStore } from '@/store/languageStore';
import { PDFDownloadButton } from '@/components/pdf/PDFDownloadButton';
import { ClientGrosExtraitPDF } from '@/components/pdf/ClientGrosExtraitPDF';
import { formatNumber } from '@/lib/utils';
import { Building2, Phone, Mail, MapPin, FileText, CreditCard } from 'lucide-react';

interface ClientGrosFicheDialogProps {
  client: ClientGros;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientGrosFicheDialog({ client, open, onOpenChange }: ClientGrosFicheDialogProps) {
  const { bonsLivraison, settings } = useAppStore();
  const { t, language } = useLanguageStore();
  const dateLocale = language === 'ar' ? ar : fr;

  const clientTypeLabels: Record<ClientGrosType, string> = {
    grossiste: t('Grossiste', 'تاجر جملة'),
    exportateur: t('Exportateur', 'مصدّر'),
    societe: t('Société', 'شركة'),
    autre: t('Autre', 'آخر'),
  };

  // Get all BLs for this client
  const clientBLs = useMemo(() => 
    bonsLivraison.filter(bl => bl.clientId === client.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [bonsLivraison, client.id]
  );

  // Calculate totals
  const totals = useMemo(() => {
    const totalQuantite = clientBLs.reduce((sum, bl) => sum + bl.quantite, 0);
    const totalHT = clientBLs.reduce((sum, bl) => sum + bl.montantHT, 0);
    const totalTVA = clientBLs.reduce((sum, bl) => sum + bl.montantTVA, 0);
    const totalTTC = clientBLs.reduce((sum, bl) => sum + bl.montantTTC, 0);
    const totalPaye = clientBLs.filter(bl => bl.paymentStatus === 'paye').reduce((sum, bl) => sum + bl.montantTTC, 0);
    const totalEnAttente = clientBLs.filter(bl => bl.paymentStatus === 'en_attente').reduce((sum, bl) => sum + bl.montantTTC, 0);
    
    return { totalQuantite, totalHT, totalTVA, totalTTC, totalPaye, totalEnAttente };
  }, [clientBLs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('Fiche Client Gros', 'بطاقة حريف الجملة')} - {client.raisonSociale}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Info Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">{t('Code', 'الرمز')}</p>
              <p className="font-medium">{client.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('Type', 'النوع')}</p>
              <p className="font-medium text-primary">{clientTypeLabels[client.clientType]}</p>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{t('Téléphone', 'الهاتف')}</p>
                <p className="font-medium">{client.phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{t('Email', 'البريد')}</p>
                <p className="font-medium text-sm">{client.email || '-'}</p>
              </div>
            </div>
            {client.matriculeFiscal && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('Matricule fiscal', 'المعرف الجبائي')}</p>
                  <p className="font-medium text-sm">{client.matriculeFiscal}</p>
                </div>
              </div>
            )}
            {client.adresse && (
              <div className="flex items-start gap-2 col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('Adresse', 'العنوان')}</p>
                  <p className="font-medium text-sm">{client.adresse}</p>
                </div>
              </div>
            )}
            {client.conditionsPaiement && (
              <div className="flex items-start gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('Conditions paiement', 'شروط الدفع')}</p>
                  <p className="font-medium text-sm">{client.conditionsPaiement}</p>
                </div>
              </div>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-primary/10 text-center">
              <p className="text-2xl font-bold text-primary">{clientBLs.length}</p>
              <p className="text-sm text-muted-foreground">{t('Bons de livraison', 'وصولات التسليم')}</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 text-center">
              <p className="text-2xl font-bold">{formatNumber(totals.totalQuantite)} kg</p>
              <p className="text-sm text-muted-foreground">{t('Quantité totale', 'الكمية الإجمالية')}</p>
            </div>
            <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20 text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatNumber(totals.totalPaye)} DT</p>
              <p className="text-sm text-muted-foreground">{t('Total payé', 'المدفوع')}</p>
            </div>
            <div className="p-4 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-center">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatNumber(totals.totalEnAttente)} DT</p>
              <p className="text-sm text-muted-foreground">{t('En attente', 'معلق')}</p>
            </div>
          </div>

          {/* Sales History Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">{t('N° BL', 'رقم الوصل')}</TableHead>
                  <TableHead className="w-[100px]">{t('Date', 'التاريخ')}</TableHead>
                  <TableHead className="text-right">{t('Quantité (kg)', 'الكمية')}</TableHead>
                  <TableHead className="text-right">{t('Prix U.', 'السعر')}</TableHead>
                  <TableHead className="text-right">{t('Montant HT', 'خام')}</TableHead>
                  <TableHead className="text-right">{t('TVA', 'ض.ق.م')}</TableHead>
                  <TableHead className="text-right">{t('TTC', 'إجمالي')}</TableHead>
                  <TableHead className="text-center">{t('Statut', 'الحالة')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientBLs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t('Aucune vente enregistrée', 'لا توجد مبيعات مسجلة')}
                    </TableCell>
                  </TableRow>
                ) : (
                  clientBLs.map((bl) => (
                    <TableRow key={bl.id}>
                      <TableCell className="font-mono font-medium text-primary">
                        {bl.number}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(bl.date), 'dd/MM/yyyy', { locale: dateLocale })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(bl.quantite)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(bl.prixUnitaire)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(bl.montantHT)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatNumber(bl.montantTVA)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatNumber(bl.montantTTC)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bl.paymentStatus === 'paye' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {bl.paymentStatus === 'paye' ? t('Payé', 'مدفوع') : t('En attente', 'معلق')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {clientBLs.length > 0 && (
                <TableFooter>
                  <TableRow className="bg-muted font-semibold">
                    <TableCell colSpan={2} className="text-right">
                      {t('TOTAUX', 'المجموع')}
                    </TableCell>
                    <TableCell className="text-right text-lg">
                      {formatNumber(totals.totalQuantite)} kg
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right">
                      {formatNumber(totals.totalHT)} DT
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatNumber(totals.totalTVA)} DT
                    </TableCell>
                    <TableCell className="text-right text-lg text-primary">
                      {formatNumber(totals.totalTTC)} DT
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>

          {/* PDF Export Button */}
          <div className="flex justify-end">
            <PDFDownloadButton
              document={
                <ClientGrosExtraitPDF
                  client={client}
                  bonsLivraison={clientBLs}
                  totals={totals}
                  companyName={settings.companyName}
                />
              }
              fileName={`extrait-${client.code}-${format(new Date(), 'yyyyMMdd')}.pdf`}
              label={t("Générer l'extrait PDF", "توليد مستخرج PDF")}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
