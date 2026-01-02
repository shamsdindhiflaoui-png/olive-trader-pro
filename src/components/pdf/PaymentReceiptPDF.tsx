import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { BonReception, Client, Payment, Trituration, Settings } from '@/types';
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
  receiptNumber: {
    fontSize: 18,
    fontWeight: 700,
    color: '#4a6741',
    textAlign: 'right',
  },
  receiptDate: {
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
    width: 160,
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
    flex: 2,
    textAlign: 'left',
  },
  tableCellRight: {
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f5f5dc',
    marginTop: 10,
    borderRadius: 4,
  },
  totalLabel: {
    flex: 2,
    fontWeight: 700,
    fontSize: 12,
  },
  totalValue: {
    flex: 1,
    fontWeight: 700,
    fontSize: 14,
    textAlign: 'right',
    color: '#4a6741',
  },
  paymentInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  paymentInfoTitle: {
    fontWeight: 600,
    marginBottom: 10,
    color: '#333',
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
  badge: {
    padding: '4 10',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeFacon: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  badgeAchat: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
});

interface PaymentPDFProps {
  payment: Payment;
  br: BonReception;
  client: Client;
  trituration: Trituration;
  settings: Settings;
}

const transactionTypeLabels = {
  facon: 'Façon (Service)',
  bawaza: 'Bawaza',
  achat_base: 'Achat à la base',
};

export function PaymentReceiptPDF({ payment, br, client, trituration, settings }: PaymentPDFProps) {
  const isFacon = client.transactionType === 'facon';
  const receiptNumber = `REC-${payment.id.toUpperCase().slice(0, 8)}`;

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
            <Text style={styles.receiptNumber}>{receiptNumber}</Text>
            <Text style={styles.receiptDate}>
              {format(new Date(payment.date), 'dd MMMM yyyy', { locale: fr })}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {isFacon ? 'REÇU DE PAIEMENT' : 'BORDEREAU DE PAIEMENT'}
        </Text>

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
        </View>

        {/* BR Reference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Référence Bon de Réception</Text>
          <View style={styles.row}>
            <Text style={styles.label}>N° BR:</Text>
            <Text style={styles.value}>{br.number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date de réception:</Text>
            <Text style={styles.value}>{format(new Date(br.date), 'dd/MM/yyyy', { locale: fr })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Poids net olives:</Text>
            <Text style={styles.value}>{br.poidsNet.toLocaleString()} kg</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Huile produite:</Text>
            <Text style={styles.value}>{trituration.quantiteHuile.toLocaleString()} L</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rendement:</Text>
            <Text style={styles.value}>{((trituration.quantiteHuile / br.poidsNet) * 100).toFixed(1)}%</Text>
          </View>
        </View>

        {/* Calcul du montant */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail du Calcul</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellLeft}>Désignation</Text>
              <Text style={styles.tableCell}>Quantité</Text>
              <Text style={styles.tableCell}>Prix Unitaire</Text>
              <Text style={styles.tableCellRight}>Montant</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLeft}>
                {isFacon ? 'Service de trituration' : "Achat d'huile d'olive"}
              </Text>
              <Text style={styles.tableCell}>
                {isFacon ? `${br.poidsNet.toLocaleString()} kg` : `${trituration.quantiteHuile.toLocaleString()} L`}
              </Text>
              <Text style={styles.tableCell}>
                {payment.prixUnitaire.toFixed(3)} DT/{isFacon ? 'kg' : 'L'}
              </Text>
              <Text style={styles.tableCellRight}>{payment.montant.toFixed(2)} DT</Text>
            </View>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {isFacon ? 'TOTAL À RECEVOIR' : 'TOTAL À PAYER'}
            </Text>
            <Text style={styles.totalValue}>{payment.montant.toFixed(2)} DT</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentInfoTitle}>Informations de Paiement</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Mode de paiement:</Text>
            <Text style={styles.value}>{payment.modePayment}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date du paiement:</Text>
            <Text style={styles.value}>{format(new Date(payment.date), 'dd MMMM yyyy', { locale: fr })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Statut:</Text>
            <Text style={styles.value}>Payé</Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Signature du client</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Cachet et signature</Text>
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
