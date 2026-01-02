import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Invoice, Client, Settings } from '@/types';
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
  colDescription: {
    flex: 4,
  },
  colQty: {
    flex: 1,
    textAlign: 'center',
  },
  colPrice: {
    flex: 1.5,
    textAlign: 'right',
  },
  colTotal: {
    flex: 1.5,
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
    minWidth: 280,
  },
  totalLabel: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 20,
    color: '#666',
  },
  totalValue: {
    width: 120,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#2d5016',
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
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2d5016',
  },
  paymentInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f0f9e8',
    borderRadius: 4,
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2d5016',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    fontSize: 9,
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
});

interface InvoicePDFProps {
  invoice: Invoice;
  client: Client;
  settings: Settings;
}

export const InvoicePDF = ({ invoice, client, settings }: InvoicePDFProps) => (
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
          <Text style={styles.documentTitle}>FACTURE</Text>
          <Text style={styles.documentNumber}>{invoice.number}</Text>
          <Text style={styles.documentDate}>
            Date: {format(new Date(invoice.date), 'dd MMMM yyyy', { locale: fr })}
          </Text>
          <Text style={styles.documentDate}>
            Échéance: {format(new Date(invoice.echeance), 'dd MMMM yyyy', { locale: fr })}
          </Text>
        </View>
      </View>

      {/* Client Info */}
      <View style={styles.clientSection}>
        <Text style={styles.sectionLabel}>Facturé à</Text>
        <Text style={styles.clientName}>{client.name}</Text>
        <Text style={styles.clientCode}>Code: {client.code}</Text>
        {client.phone && <Text style={styles.clientCode}>Tél: {client.phone}</Text>}
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colDescription}>Désignation</Text>
          <Text style={styles.colQty}>Qté</Text>
          <Text style={styles.colPrice}>Prix Unit. (DT)</Text>
          <Text style={styles.colTotal}>Total (DT)</Text>
        </View>
        {invoice.lignes.map((ligne, index) => (
          <View key={ligne.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={styles.colDescription}>{ligne.description}</Text>
            <Text style={styles.colQty}>{ligne.quantite}</Text>
            <Text style={styles.colPrice}>{ligne.prixUnitaire.toFixed(3)}</Text>
            <Text style={styles.colTotal}>{ligne.montant.toFixed(3)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total HT:</Text>
          <Text style={styles.totalValue}>{invoice.montantHT.toFixed(3)} DT</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TVA ({invoice.tauxTVA}%):</Text>
          <Text style={styles.totalValue}>{invoice.montantTVA.toFixed(3)} DT</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Droit de Timbre:</Text>
          <Text style={styles.totalValue}>{invoice.droitTimbre.toFixed(3)} DT</Text>
        </View>
        <View style={styles.grandTotal}>
          <Text style={styles.grandTotalLabel}>Total TTC:</Text>
          <Text style={styles.grandTotalValue}>{invoice.montantTTC.toFixed(3)} DT</Text>
        </View>
      </View>

      {/* Payment Status */}
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentTitle}>État du paiement</Text>
        <View style={styles.paymentRow}>
          <Text>Montant payé:</Text>
          <Text style={{ fontWeight: 'bold' }}>{invoice.montantPaye.toFixed(3)} DT</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text>Reste à payer:</Text>
          <Text style={{ fontWeight: 'bold', color: invoice.resteAPayer > 0 ? '#d97706' : '#16a34a' }}>
            {invoice.resteAPayer.toFixed(3)} DT
          </Text>
        </View>
      </View>

      {/* Observations */}
      {invoice.observations && (
        <View style={styles.observations}>
          <Text style={styles.observationsLabel}>Observations:</Text>
          <Text style={styles.observationsText}>{invoice.observations}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {settings.companyName} - Document généré le {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}
        </Text>
      </View>
    </Page>
  </Document>
);
