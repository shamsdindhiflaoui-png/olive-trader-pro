import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { BonReception, Client, Settings } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

Font.register({
  family: 'Amiri',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUpvrIw74NL.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/amiri/v27/J7acnpd8CGxBHp2VkZY4xJ9CGyAa.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Amiri',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#4a6741',
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    color: '#4a6741',
  },
  logoSubtitle: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4a6741',
    padding: 8,
    color: '#fff',
    fontWeight: 600,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  colDate: {
    width: '15%',
    textAlign: 'left',
  },
  colBR: {
    width: '15%',
    textAlign: 'left',
  },
  colClient: {
    width: '30%',
    textAlign: 'left',
  },
  colVehicle: {
    width: '20%',
    textAlign: 'left',
  },
  colPoids: {
    width: '20%',
    textAlign: 'right',
    fontWeight: 600,
  },
  totalsRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#4a6741',
    marginTop: 2,
  },
  totalsLabel: {
    width: '80%',
    textAlign: 'right',
    color: '#fff',
    fontWeight: 700,
    fontSize: 11,
    paddingRight: 10,
  },
  totalsValue: {
    width: '20%',
    textAlign: 'right',
    color: '#fff',
    fontWeight: 700,
    fontSize: 11,
  },
  summary: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f5f5dc',
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#4a6741',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#999',
    fontSize: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

interface BREnCoursPDFProps {
  brs: BonReception[];
  clients: Client[];
  settings: Settings;
  filterInfo?: string;
}

export function BREnCoursPDF({ brs, clients, settings, filterInfo }: BREnCoursPDFProps) {
  const getClient = (clientId: string) => clients.find(c => c.id === clientId);
  const totalPoids = brs.reduce((sum, br) => sum + br.poidsNet, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>{settings.companyName}</Text>
            <Text style={styles.logoSubtitle}>Huilerie - Gestion des olives</Text>
            {settings.address && <Text style={styles.logoSubtitle}>{settings.address}</Text>}
            {settings.phone && <Text style={styles.logoSubtitle}>Tél: {settings.phone}</Text>}
          </View>
          <View>
            <Text style={{ fontSize: 10, color: '#666', textAlign: 'right' }}>
              {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>BONS DE RÉCEPTION EN COURS</Text>
        <Text style={styles.subtitle}>
          Liste des BR en attente de trituration{filterInfo ? ` - ${filterInfo}` : ''}
        </Text>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colBR}>N° BR</Text>
            <Text style={styles.colClient}>Client (الحريف)</Text>
            <Text style={styles.colVehicle}>Véhicule</Text>
            <Text style={styles.colPoids}>Poids Net (kg)</Text>
          </View>
          {brs.map((br, index) => (
            <View key={br.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.colDate}>
                {format(new Date(br.date), 'dd/MM/yyyy')}
              </Text>
              <Text style={styles.colBR}>{br.number}</Text>
              <Text style={styles.colClient}>{getClient(br.clientId)?.name || '-'}</Text>
              <Text style={styles.colVehicle}>{br.vehicle || '-'}</Text>
              <Text style={styles.colPoids}>{br.poidsNet.toLocaleString()}</Text>
            </View>
          ))}
          {/* Totals Row */}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>TOTAL ({brs.length} BR)</Text>
            <Text style={styles.totalsValue}>{totalPoids.toLocaleString()} kg</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Nombre de BR</Text>
            <Text style={styles.summaryValue}>{brs.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Poids Total</Text>
            <Text style={styles.summaryValue}>{totalPoids.toLocaleString()} kg</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Document généré le {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })} - {settings.companyName}
        </Text>
      </Page>
    </Document>
  );
}
