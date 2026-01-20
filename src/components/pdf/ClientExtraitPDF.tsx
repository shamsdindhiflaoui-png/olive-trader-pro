import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Client, ClientOperationType } from '@/types';

Font.register({
  family: 'Amiri',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUpvrIw74NL.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/amiri/v27/J7acnpd8CGxBHp2VkZY4xJ9CGyAa.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Amiri',
    fontSize: 10,
    padding: 30,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  clientInfo: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    marginBottom: 15,
    borderRadius: 4,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  clientCode: {
    fontSize: 10,
    color: '#6b7280',
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  dateValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
  },
  summarySection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#374151',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 8,
    textAlign: 'center',
  },
  tableHeaderArabic: {
    color: '#ffffff',
    fontSize: 7,
    textAlign: 'center',
    marginTop: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRowEven: {
    backgroundColor: '#f9fafb',
  },
  tableRowOdd: {
    backgroundColor: '#ffffff',
  },
  tableCell: {
    fontSize: 9,
    textAlign: 'center',
  },
  tableCellLeft: {
    fontSize: 9,
    textAlign: 'left',
  },
  // Column widths
  colDate: { width: '12%' },
  colType: { width: '10%' },
  colRef: { width: '14%' },
  colLibelle: { width: '24%' },
  colCapital: { width: '10%' },
  colAvance: { width: '10%' },
  colHuile: { width: '10%' },
  colPaye: { width: '10%' },
  // Type badges
  typeBR: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: 2,
    borderRadius: 2,
    fontSize: 7,
    textAlign: 'center',
  },
  typeDirect: {
    backgroundColor: '#ffedd5',
    color: '#c2410c',
    padding: 2,
    borderRadius: 2,
    fontSize: 7,
    textAlign: 'center',
  },
  typeCapital: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: 2,
    borderRadius: 2,
    fontSize: 7,
    textAlign: 'center',
  },
  typeAvance: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: 2,
    borderRadius: 2,
    fontSize: 7,
    textAlign: 'center',
  },
  paidBadge: {
    color: '#16a34a',
    fontSize: 8,
    fontWeight: 'bold',
  },
  unpaidBadge: {
    color: '#dc2626',
    fontSize: 8,
    fontWeight: 'bold',
  },
  positiveBalance: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  negativeBalance: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  totalsRow: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  totalsCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
});

interface ExtraitOperation {
  id: string;
  date: Date;
  libelle: string;
  type: ClientOperationType | 'br' | 'direct';
  capitalDT?: number;
  avanceDT?: number;
  huileL?: number;
  isPaid?: boolean;
  reference?: string;
}

interface ClientExtraitPDFProps {
  client: Client;
  capitalDT: number;
  avanceDT: number;
  totalPayments: number;
  companyName?: string;
  operations?: ExtraitOperation[];
}

const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return '-';
  return num.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
};

const getTypeLabel = (type: ClientOperationType | 'br' | 'direct'): { fr: string; ar: string } => {
  switch (type) {
    case 'br':
      return { fr: 'BR', ar: 'وصل' };
    case 'direct':
      return { fr: 'Direct', ar: 'مباشر' };
    case 'capital_fdr':
      return { fr: 'Capital', ar: 'رأسمال' };
    case 'avance':
      return { fr: 'Avance', ar: 'تسبيق' };
    default:
      return { fr: 'Autre', ar: 'آخر' };
  }
};

const getTypeStyle = (type: ClientOperationType | 'br' | 'direct') => {
  switch (type) {
    case 'br':
      return styles.typeBR;
    case 'direct':
      return styles.typeDirect;
    case 'capital_fdr':
      return styles.typeCapital;
    case 'avance':
      return styles.typeAvance;
    default:
      return styles.typeBR;
  }
};

export function ClientExtraitPDF({ 
  client, 
  capitalDT, 
  avanceDT, 
  totalPayments,
  companyName = 'Huilerie',
  operations = []
}: ClientExtraitPDFProps) {
  const solde = (capitalDT + avanceDT) - totalPayments;

  // Calculate totals for huile
  const totalHuile = operations
    .filter(op => op.type === 'br' || op.type === 'direct')
    .reduce((sum, op) => sum + (op.huileL || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>
            Extrait de Compte Client | مستخرج حساب الحريف
          </Text>
          <View style={styles.dateSection}>
            <View>
              <Text style={styles.dateLabel}>Date d'édition | تاريخ الإصدار</Text>
              <Text style={styles.dateValue}>
                {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
              </Text>
            </View>
            <View>
              <Text style={styles.dateLabel}>Heure | الساعة</Text>
              <Text style={styles.dateValue}>
                {format(new Date(), 'HH:mm', { locale: fr })}
              </Text>
            </View>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{client.name}</Text>
          <Text style={styles.clientCode}>Code: {client.code} | CIN: {client.cin || '-'}</Text>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Résumé Financier | ملخص مالي</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Capital (DT) | رأس المال:</Text>
            <Text style={styles.summaryValue}>{formatNumber(capitalDT)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Avances (DT) | التسبيقات:</Text>
            <Text style={styles.summaryValue}>{formatNumber(avanceDT)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Montants Payés (DT) | المبالغ المدفوعة:</Text>
            <Text style={styles.summaryValue}>{formatNumber(totalPayments)}</Text>
          </View>
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#1e40af', paddingTop: 4, marginTop: 4 }]}>
            <Text style={[styles.summaryLabel, { fontWeight: 'bold' }]}>Solde (DT) | الرصيد:</Text>
            <Text style={[styles.summaryValue, solde >= 0 ? styles.positiveBalance : styles.negativeBalance]}>
              {formatNumber(solde)}
            </Text>
          </View>
        </View>

        {/* Operations Table */}
        {operations.length > 0 && (
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.colDate}>
                <Text style={styles.tableHeaderCell}>Date</Text>
                <Text style={styles.tableHeaderArabic}>التاريخ</Text>
              </View>
              <View style={styles.colType}>
                <Text style={styles.tableHeaderCell}>Type</Text>
                <Text style={styles.tableHeaderArabic}>النوع</Text>
              </View>
              <View style={styles.colRef}>
                <Text style={styles.tableHeaderCell}>Référence</Text>
                <Text style={styles.tableHeaderArabic}>المرجع</Text>
              </View>
              <View style={styles.colLibelle}>
                <Text style={styles.tableHeaderCell}>Libellé</Text>
                <Text style={styles.tableHeaderArabic}>البيان</Text>
              </View>
              <View style={styles.colCapital}>
                <Text style={styles.tableHeaderCell}>Capital</Text>
                <Text style={styles.tableHeaderArabic}>رأسمال</Text>
              </View>
              <View style={styles.colAvance}>
                <Text style={styles.tableHeaderCell}>Avance</Text>
                <Text style={styles.tableHeaderArabic}>تسبيق</Text>
              </View>
              <View style={styles.colHuile}>
                <Text style={styles.tableHeaderCell}>Huile (L)</Text>
                <Text style={styles.tableHeaderArabic}>الزيت</Text>
              </View>
              <View style={styles.colPaye}>
                <Text style={styles.tableHeaderCell}>Payé</Text>
                <Text style={styles.tableHeaderArabic}>مدفوع</Text>
              </View>
            </View>

            {/* Table Rows */}
            {operations.map((op, index) => (
              <View key={op.id} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                <View style={styles.colDate}>
                  <Text style={styles.tableCell}>{format(new Date(op.date), 'dd/MM/yy')}</Text>
                </View>
                <View style={styles.colType}>
                  <View style={getTypeStyle(op.type)}>
                    <Text>{getTypeLabel(op.type).fr}</Text>
                  </View>
                </View>
                <View style={styles.colRef}>
                  <Text style={styles.tableCell}>{op.reference || '-'}</Text>
                </View>
                <View style={styles.colLibelle}>
                  <Text style={styles.tableCellLeft}>
                    {op.libelle.length > 30 ? op.libelle.substring(0, 30) + '...' : op.libelle}
                  </Text>
                </View>
                <View style={styles.colCapital}>
                  <Text style={styles.tableCell}>{op.capitalDT ? formatNumber(op.capitalDT) : '-'}</Text>
                </View>
                <View style={styles.colAvance}>
                  <Text style={styles.tableCell}>{op.avanceDT ? formatNumber(op.avanceDT) : '-'}</Text>
                </View>
                <View style={styles.colHuile}>
                  <Text style={styles.tableCell}>
                    {(op.type === 'br' || op.type === 'direct') && op.huileL !== undefined 
                      ? op.huileL.toFixed(1) 
                      : '-'}
                  </Text>
                </View>
                <View style={styles.colPaye}>
                  {(op.type === 'br' || op.type === 'direct') ? (
                    <Text style={op.isPaid ? styles.paidBadge : styles.unpaidBadge}>
                      {op.isPaid ? '✓' : '✗'}
                    </Text>
                  ) : (
                    <Text style={styles.tableCell}>-</Text>
                  )}
                </View>
              </View>
            ))}

            {/* Totals Row */}
            <View style={styles.totalsRow}>
              <View style={styles.colDate}>
                <Text style={styles.totalsCell}>TOTAL</Text>
              </View>
              <View style={styles.colType}>
                <Text style={styles.totalsCell}></Text>
              </View>
              <View style={styles.colRef}>
                <Text style={styles.totalsCell}></Text>
              </View>
              <View style={styles.colLibelle}>
                <Text style={styles.totalsCell}></Text>
              </View>
              <View style={styles.colCapital}>
                <Text style={styles.totalsCell}>{formatNumber(capitalDT)}</Text>
              </View>
              <View style={styles.colAvance}>
                <Text style={styles.totalsCell}>{formatNumber(avanceDT)}</Text>
              </View>
              <View style={styles.colHuile}>
                <Text style={styles.totalsCell}>{totalHuile.toFixed(1)}</Text>
              </View>
              <View style={styles.colPaye}>
                <Text style={styles.totalsCell}></Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Document généré automatiquement le {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })} - {companyName}
          </Text>
          <Text style={{ marginTop: 2 }}>
            وثيقة صادرة تلقائيا - {companyName}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
