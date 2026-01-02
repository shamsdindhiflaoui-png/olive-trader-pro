import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Client } from '@/types';

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
    fontSize: 11,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dateLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  dateValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 9,
    textAlign: 'center',
  },
  tableHeaderArabic: {
    color: '#ffffff',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 11,
    textAlign: 'center',
  },
  tableCellName: {
    fontSize: 11,
    textAlign: 'left',
    fontWeight: 'bold',
  },
  col1: { width: '25%' },
  col2: { width: '18%' },
  col3: { width: '18%' },
  col4: { width: '20%' },
  col5: { width: '19%' },
  positiveBalance: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  negativeBalance: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
});

interface ClientExtraitPDFProps {
  client: Client;
  capitalDT: number;
  avanceDT: number;
  totalPayments: number;
  companyName?: string;
}

export function ClientExtraitPDF({ 
  client, 
  capitalDT, 
  avanceDT, 
  totalPayments,
  companyName = 'Huilerie' 
}: ClientExtraitPDFProps) {
  const solde = (capitalDT + avanceDT) - totalPayments;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={{ fontSize: 14, color: '#374151', marginBottom: 5 }}>
            Extrait de Compte Client
          </Text>
          <View style={styles.dateSection}>
            <View>
              <Text style={styles.dateLabel}>Date d'édition</Text>
              <Text style={styles.dateValue}>
                {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
              </Text>
            </View>
            <View>
              <Text style={styles.dateLabel}>Heure</Text>
              <Text style={styles.dateValue}>
                {format(new Date(), 'HH:mm', { locale: fr })}
              </Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.col1}>
              <Text style={styles.tableHeaderCell}>Nom Client</Text>
              <Text style={styles.tableHeaderArabic}>اسم الحريف</Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.tableHeaderCell}>Capital (DT)</Text>
              <Text style={styles.tableHeaderArabic}>رأس المــال</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.tableHeaderCell}>Avances (DT)</Text>
              <Text style={styles.tableHeaderArabic}>تسبقة</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.tableHeaderCell}>Montants Payés (DT)</Text>
              <Text style={styles.tableHeaderArabic}>المبالغ المدفوعة</Text>
            </View>
            <View style={styles.col5}>
              <Text style={styles.tableHeaderCell}>Solde (DT)</Text>
              <Text style={styles.tableHeaderArabic}>الرصيد</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCellName, styles.col1]}>{client.name}</Text>
            <Text style={[styles.tableCell, styles.col2]}>{capitalDT.toFixed(3)}</Text>
            <Text style={[styles.tableCell, styles.col3]}>{avanceDT.toFixed(3)}</Text>
            <Text style={[styles.tableCell, styles.col4]}>{totalPayments.toFixed(3)}</Text>
            <Text style={[styles.tableCell, styles.col5, solde >= 0 ? styles.positiveBalance : styles.negativeBalance]}>
              {solde >= 0 ? '+' : ''}{solde.toFixed(3)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Document généré le {format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })} - {companyName}
        </Text>
      </Page>
    </Document>
  );
}
