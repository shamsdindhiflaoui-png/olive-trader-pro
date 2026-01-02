import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
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
  subtitle: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 5,
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
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 10,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRowEven: {
    backgroundColor: '#f9fafb',
  },
  tableRowOdd: {
    backgroundColor: '#ffffff',
  },
  tableCell: {
    fontSize: 10,
    textAlign: 'center',
  },
  tableCellName: {
    fontSize: 10,
    textAlign: 'left',
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
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  totalCell: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
  },
  totalLabel: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'left',
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

interface ClientData {
  name: string;
  capitalDT: number;
  avanceDT: number;
  totalPayments: number;
}

interface AllClientsExtraitPDFProps {
  clients: ClientData[];
  companyName?: string;
}

export function AllClientsExtraitPDF({ 
  clients, 
  companyName = 'Huilerie' 
}: AllClientsExtraitPDFProps) {
  // Calculate totals
  const totals = clients.reduce(
    (acc, client) => ({
      capitalDT: acc.capitalDT + client.capitalDT,
      avanceDT: acc.avanceDT + client.avanceDT,
      totalPayments: acc.totalPayments + client.totalPayments,
    }),
    { capitalDT: 0, avanceDT: 0, totalPayments: 0 }
  );
  const totalSolde = (totals.capitalDT + totals.avanceDT) - totals.totalPayments;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>Extrait Complet - Tous les Clients</Text>
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
            <View>
              <Text style={styles.dateLabel}>Nombre de clients</Text>
              <Text style={styles.dateValue}>{clients.length}</Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.col1]}>Nom Client</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>Capital (DT)</Text>
            <Text style={[styles.tableHeaderCell, styles.col3]}>Avances (DT)</Text>
            <Text style={[styles.tableHeaderCell, styles.col4]}>Montants Payés (DT)</Text>
            <Text style={[styles.tableHeaderCell, styles.col5]}>Solde (DT)</Text>
          </View>
          
          {clients.map((client, index) => {
            const solde = (client.capitalDT + client.avanceDT) - client.totalPayments;
            return (
              <View 
                key={index} 
                style={[
                  styles.tableRow, 
                  index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                ]}
              >
                <Text style={[styles.tableCellName, styles.col1]}>{client.name}</Text>
                <Text style={[styles.tableCell, styles.col2]}>{client.capitalDT.toFixed(3)}</Text>
                <Text style={[styles.tableCell, styles.col3]}>{client.avanceDT.toFixed(3)}</Text>
                <Text style={[styles.tableCell, styles.col4]}>{client.totalPayments.toFixed(3)}</Text>
                <Text style={[styles.tableCell, styles.col5, solde >= 0 ? styles.positiveBalance : styles.negativeBalance]}>
                  {solde >= 0 ? '+' : ''}{solde.toFixed(3)}
                </Text>
              </View>
            );
          })}

          {/* Total Row */}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.col1]}>TOTAL</Text>
            <Text style={[styles.totalCell, styles.col2]}>{totals.capitalDT.toFixed(3)}</Text>
            <Text style={[styles.totalCell, styles.col3]}>{totals.avanceDT.toFixed(3)}</Text>
            <Text style={[styles.totalCell, styles.col4]}>{totals.totalPayments.toFixed(3)}</Text>
            <Text style={[styles.totalCell, styles.col5]}>
              {totalSolde >= 0 ? '+' : ''}{totalSolde.toFixed(3)}
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
