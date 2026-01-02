import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { BonReception, Client, Settings } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Register fonts
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Open Sans',
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
  brNumber: {
    fontSize: 24,
    fontWeight: 700,
    color: '#4a6741',
    textAlign: 'right',
  },
  brDate: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#4a6741',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: 140,
    color: '#666',
  },
  value: {
    flex: 1,
    fontWeight: 600,
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
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
  tableCellLeft: {
    flex: 1,
    textAlign: 'left',
  },
  highlight: {
    backgroundColor: '#f5f5dc',
    padding: 12,
    marginTop: 10,
    borderRadius: 4,
  },
  highlightText: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
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
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 50,
  },
  signatureBox: {
    width: '40%',
    textAlign: 'center',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginTop: 40,
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#666',
  },
});

interface BRPDFProps {
  br: BonReception;
  client: Client;
  settings: Settings;
}

const transactionTypeLabels = {
  facon: 'Façon (Service)',
  bawaza: 'Bawaza',
  achat_base: 'Achat à la base',
};

export function BonReceptionPDF({ br, client, settings }: BRPDFProps) {
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
            <Text style={styles.brNumber}>{br.number}</Text>
            <Text style={styles.brDate}>
              {format(new Date(br.date), 'dd MMMM yyyy', { locale: fr })}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>BON DE RÉCEPTION</Text>

        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations Client</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Code client:</Text>
            <Text style={styles.value}>{client.code}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nom / Raison sociale:</Text>
            <Text style={styles.value}>{client.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Type de transaction:</Text>
            <Text style={styles.value}>{transactionTypeLabels[client.transactionType]}</Text>
          </View>
          {client.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Téléphone:</Text>
              <Text style={styles.value}>{client.phone}</Text>
            </View>
          )}
        </View>

        {/* Pesée */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails de la Pesée</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCell}>Poids Plein (kg)</Text>
              <Text style={styles.tableCell}>Poids Vide (kg)</Text>
              <Text style={styles.tableCell}>Poids Net (kg)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>{br.poidsPlein.toLocaleString()}</Text>
              <Text style={styles.tableCell}>{br.poidsVide.toLocaleString()}</Text>
              <Text style={styles.tableCell}>{br.poidsNet.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.highlight}>
            <Text style={styles.highlightText}>
              POIDS NET: {br.poidsNet.toLocaleString()} kg
            </Text>
          </View>
        </View>

        {/* Vehicle */}
        {br.vehicle && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Véhicule</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Immatriculation:</Text>
              <Text style={styles.value}>{br.vehicle}</Text>
            </View>
          </View>
        )}

        {/* Observations */}
        {br.observations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observations</Text>
            <Text>{br.observations}</Text>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Signature du client</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Signature de l'huilerie</Text>
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
