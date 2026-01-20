import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ClientOperationType } from '@/types';

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
    fontSize: 9,
    padding: 25,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 3,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
  dateValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },
  // Summary section
  summarySection: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#374151',
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
  },
  // Table styles
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 7,
    textAlign: 'center',
  },
  tableHeaderArabic: {
    color: '#ffffff',
    fontSize: 6,
    textAlign: 'center',
    marginTop: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRowEven: {
    backgroundColor: '#f9fafb',
  },
  tableRowOdd: {
    backgroundColor: '#ffffff',
  },
  clientHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e7ff',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#6366f1',
  },
  clientName: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#3730a3',
  },
  tableCell: {
    fontSize: 8,
    textAlign: 'center',
  },
  tableCellLeft: {
    fontSize: 8,
    textAlign: 'left',
  },
  // Column widths for detailed table
  colClient: { width: '14%' },
  colDate: { width: '10%' },
  colType: { width: '8%' },
  colRef: { width: '12%' },
  colLibelle: { width: '20%' },
  colCapital: { width: '9%' },
  colAvance: { width: '9%' },
  colHuile: { width: '9%' },
  colPaye: { width: '9%' },
  // Type badges
  typeBR: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: 2,
    borderRadius: 2,
    fontSize: 6,
    textAlign: 'center',
  },
  typeDirect: {
    backgroundColor: '#ffedd5',
    color: '#c2410c',
    padding: 2,
    borderRadius: 2,
    fontSize: 6,
    textAlign: 'center',
  },
  typeCapital: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: 2,
    borderRadius: 2,
    fontSize: 6,
    textAlign: 'center',
  },
  typeAvance: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: 2,
    borderRadius: 2,
    fontSize: 6,
    textAlign: 'center',
  },
  paidBadge: {
    color: '#16a34a',
    fontSize: 7,
    fontWeight: 'bold',
  },
  unpaidBadge: {
    color: '#dc2626',
    fontSize: 7,
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
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  totalCell: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 8,
    textAlign: 'center',
  },
  totalLabel: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 8,
    textAlign: 'left',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 25,
    right: 25,
    textAlign: 'center',
    fontSize: 7,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    right: 25,
    fontSize: 8,
    color: '#6b7280',
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

interface ClientWithOperations {
  id: string;
  name: string;
  code: string;
  capitalDT: number;
  avanceDT: number;
  totalPayments: number;
  operations: ExtraitOperation[];
}

interface AllClientsExtraitPDFProps {
  clients: ClientWithOperations[];
  companyName?: string;
}

const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return '-';
  return num.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
};

const getTypeLabel = (type: ClientOperationType | 'br' | 'direct'): string => {
  switch (type) {
    case 'br':
      return 'BR';
    case 'direct':
      return 'Direct';
    case 'capital_fdr':
      return 'Capital';
    case 'avance':
      return 'Avance';
    default:
      return 'Autre';
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

export function AllClientsExtraitPDF({ 
  clients, 
  companyName = 'Huilerie' 
}: AllClientsExtraitPDFProps) {
  // Calculate global totals
  const totals = clients.reduce(
    (acc, client) => ({
      capitalDT: acc.capitalDT + client.capitalDT,
      avanceDT: acc.avanceDT + client.avanceDT,
      totalPayments: acc.totalPayments + client.totalPayments,
      totalHuile: acc.totalHuile + client.operations
        .filter(op => op.type === 'br' || op.type === 'direct')
        .reduce((sum, op) => sum + (op.huileL || 0), 0),
      totalOperations: acc.totalOperations + client.operations.length,
    }),
    { capitalDT: 0, avanceDT: 0, totalPayments: 0, totalHuile: 0, totalOperations: 0 }
  );
  const totalSolde = (totals.capitalDT + totals.avanceDT) - totals.totalPayments;

  // Flatten all operations with client info for the detailed table
  const allOperations = clients.flatMap(client => 
    client.operations.map(op => ({
      ...op,
      clientName: client.name,
      clientCode: client.code,
    }))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>
            Extrait Complet - Tous les Clients | مستخرج شامل - كل الحرفاء
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
            <View>
              <Text style={styles.dateLabel}>Clients | الحرفاء</Text>
              <Text style={styles.dateValue}>{clients.length}</Text>
            </View>
            <View>
              <Text style={styles.dateLabel}>Opérations | العمليات</Text>
              <Text style={styles.dateValue}>{totals.totalOperations}</Text>
            </View>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Récapitulatif Global | ملخص شامل</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Capital: </Text>
              <Text style={styles.summaryValue}>{formatNumber(totals.capitalDT)} DT</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Avances: </Text>
              <Text style={styles.summaryValue}>{formatNumber(totals.avanceDT)} DT</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Payé: </Text>
              <Text style={styles.summaryValue}>{formatNumber(totals.totalPayments)} DT</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Huile: </Text>
              <Text style={styles.summaryValue}>{totals.totalHuile.toFixed(1)} L</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Solde Global: </Text>
              <Text style={[styles.summaryValue, totalSolde >= 0 ? styles.positiveBalance : styles.negativeBalance]}>
                {formatNumber(totalSolde)} DT
              </Text>
            </View>
          </View>
        </View>

        {/* Detailed Operations Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colClient}>
              <Text style={styles.tableHeaderCell}>Client</Text>
              <Text style={styles.tableHeaderArabic}>الحريف</Text>
            </View>
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
          {allOperations.map((op, index) => (
            <View key={op.id} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
              <View style={styles.colClient}>
                <Text style={styles.tableCellLeft}>
                  {op.clientName.length > 12 ? op.clientName.substring(0, 12) + '...' : op.clientName}
                </Text>
              </View>
              <View style={styles.colDate}>
                <Text style={styles.tableCell}>{format(new Date(op.date), 'dd/MM/yy')}</Text>
              </View>
              <View style={styles.colType}>
                <View style={getTypeStyle(op.type)}>
                  <Text>{getTypeLabel(op.type)}</Text>
                </View>
              </View>
              <View style={styles.colRef}>
                <Text style={styles.tableCell}>{op.reference || '-'}</Text>
              </View>
              <View style={styles.colLibelle}>
                <Text style={styles.tableCellLeft}>
                  {op.libelle.length > 25 ? op.libelle.substring(0, 25) + '...' : op.libelle}
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

          {/* Total Row */}
          <View style={styles.totalRow}>
            <View style={styles.colClient}>
              <Text style={styles.totalLabel}>TOTAL</Text>
            </View>
            <View style={styles.colDate}>
              <Text style={styles.totalCell}></Text>
            </View>
            <View style={styles.colType}>
              <Text style={styles.totalCell}></Text>
            </View>
            <View style={styles.colRef}>
              <Text style={styles.totalCell}></Text>
            </View>
            <View style={styles.colLibelle}>
              <Text style={styles.totalCell}>{totals.totalOperations} opérations</Text>
            </View>
            <View style={styles.colCapital}>
              <Text style={styles.totalCell}>{formatNumber(totals.capitalDT)}</Text>
            </View>
            <View style={styles.colAvance}>
              <Text style={styles.totalCell}>{formatNumber(totals.avanceDT)}</Text>
            </View>
            <View style={styles.colHuile}>
              <Text style={styles.totalCell}>{totals.totalHuile.toFixed(1)}</Text>
            </View>
            <View style={styles.colPaye}>
              <Text style={styles.totalCell}></Text>
            </View>
          </View>
        </View>

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
