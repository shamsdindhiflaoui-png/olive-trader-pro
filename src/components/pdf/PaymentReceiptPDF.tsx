import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { PaymentReceipt, Client, Settings, PaymentMode, BRNature, CashFlowType } from '@/types';
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
    fontSize: 10,
    fontFamily: 'Amiri',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2d5016',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  documentInfo: {
    alignItems: 'flex-end',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 8,
  },
  documentNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  clientSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  sectionLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clientName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  clientCode: {
    fontSize: 9,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f0f9e8',
    borderRadius: 4,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2d5016',
    padding: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 10,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 10,
    backgroundColor: '#fafafa',
  },
  colBR: {
    flex: 1.5,
  },
  colDate: {
    flex: 1.2,
  },
  colQty: {
    flex: 1,
    textAlign: 'center',
  },
  colPrice: {
    flex: 1,
    textAlign: 'right',
  },
  colTotal: {
    flex: 1.2,
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderWidth: 2,
    borderColor: '#2d5016',
    borderRadius: 4,
    backgroundColor: '#f0f9e8',
    minWidth: 280,
  },
  grandTotalLabel: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 20,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2d5016',
  },
  grandTotalValue: {
    width: 120,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d5016',
  },
  paymentInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    fontSize: 9,
  },
  observations: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff9e6',
    borderRadius: 4,
  },
  observationsLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 4,
  },
  observationsText: {
    fontSize: 9,
    color: '#333',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '40%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  cashFlowBadge: {
    padding: 5,
    borderRadius: 4,
    marginTop: 5,
  },
});

const paymentModeLabels: Record<PaymentMode, string> = {
  especes: 'Espèces',
  virement: 'Virement',
  compensation: 'Compensation',
};

const natureLabels: Record<BRNature, string> = {
  bawaz: 'Achat Huile',
};

const cashFlowLabels: Record<CashFlowType, string> = {
  entrant: 'Flux Entrant (Encaissement)',
  sortant: 'Flux Sortant (Décaissement)',
};

interface PaymentReceiptPDFProps {
  receipt: PaymentReceipt;
  client: Client;
  settings: Settings;
}

export const PaymentReceiptPDF = ({ receipt, client, settings }: PaymentReceiptPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{settings.companyName}</Text>
          <Text style={styles.companyDetails}>
            {settings.address && `${settings.address}\n`}
            {settings.phone && `Tél: ${settings.phone}`}
          </Text>
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle}>REÇU DE RÈGLEMENT</Text>
          <Text style={styles.documentNumber}>{receipt.number}</Text>
          <Text style={styles.documentDate}>
            Date: {format(new Date(receipt.date), 'dd MMMM yyyy', { locale: fr })}
          </Text>
        </View>
      </View>

      {/* Client Info */}
      <View style={styles.clientSection}>
        <Text style={styles.sectionLabel}>Client</Text>
        <Text style={styles.clientName}>{client.name}</Text>
        <Text style={styles.clientCode}>Code: {client.code}</Text>
        {client.phone && <Text style={styles.clientCode}>Tél: {client.phone}</Text>}
      </View>

      {/* Transaction Info */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Nature de l'opération</Text>
          <Text style={styles.infoValue}>{natureLabels[receipt.nature]}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Mode de règlement</Text>
          <Text style={styles.infoValue}>{paymentModeLabels[receipt.modePayment]}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Nombre de BR</Text>
          <Text style={styles.infoValue}>{receipt.lines.length}</Text>
        </View>
      </View>

      {/* Cash Flow Type Indicator */}
      <View style={[styles.cashFlowBadge, { 
        backgroundColor: receipt.cashFlowType === 'entrant' ? '#dcfce7' : '#fee2e2',
        marginBottom: 15
      }]}>
        <Text style={{ 
          fontSize: 11, 
          fontWeight: 'bold', 
          textAlign: 'center',
          color: receipt.cashFlowType === 'entrant' ? '#166534' : '#991b1b'
        }}>
          {receipt.cashFlowType === 'entrant' 
            ? '💰 ENCAISSEMENT - Client paie l\'huilerie'
            : '💸 DÉCAISSEMENT - Huilerie paie le client'
          }
        </Text>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colBR}>N° BR</Text>
          <Text style={styles.colDate}>Date BR</Text>
          <Text style={styles.colQty}>Huile (kg)</Text>
          <Text style={styles.colPrice}>P.U. (DT)</Text>
          <Text style={styles.colTotal}>Montant (DT)</Text>
        </View>
        {receipt.lines.map((line, index) => (
          <View key={line.brId} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={styles.colBR}>{line.brNumber}</Text>
            <Text style={styles.colDate}>
              {format(new Date(line.brDate), 'dd/MM/yyyy', { locale: fr })}
            </Text>
            <Text style={styles.colQty}>
              {line.quantiteHuile.toLocaleString()}
            </Text>
            <Text style={styles.colPrice}>{line.prixUnitaire.toFixed(3)}</Text>
            <Text style={styles.colTotal}>{line.montant.toFixed(3)}</Text>
          </View>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalsSection}>
        <View style={styles.grandTotal}>
          <Text style={styles.grandTotalLabel}>
            {receipt.cashFlowType === 'entrant' ? 'TOTAL ENCAISSÉ:' : 'TOTAL DÉCAISSÉ:'}
          </Text>
          <Text style={styles.grandTotalValue}>{receipt.totalMontant.toFixed(3)} DT</Text>
        </View>
      </View>

      {/* Payment Mode Details */}
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentTitle}>Détails du règlement</Text>
        <View style={styles.paymentRow}>
          <Text>Mode de paiement:</Text>
          <Text style={{ fontWeight: 'bold' }}>{paymentModeLabels[receipt.modePayment]}</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text>Date du règlement:</Text>
          <Text style={{ fontWeight: 'bold' }}>
            {format(new Date(receipt.date), 'dd/MM/yyyy', { locale: fr })}
          </Text>
        </View>
        <View style={styles.paymentRow}>
          <Text>Flux de caisse:</Text>
          <Text style={{ fontWeight: 'bold' }}>
            {cashFlowLabels[receipt.cashFlowType]}
          </Text>
        </View>
      </View>

      {/* Observations */}
      {receipt.observations && (
        <View style={styles.observations}>
          <Text style={styles.observationsLabel}>Observations:</Text>
          <Text style={styles.observationsText}>{receipt.observations}</Text>
        </View>
      )}

      {/* Signatures */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Signature Client</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Cachet et Signature</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {settings.companyName} - Document généré le {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}
        </Text>
      </View>
    </Page>
  </Document>
);
