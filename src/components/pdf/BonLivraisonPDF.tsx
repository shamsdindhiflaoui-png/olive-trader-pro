import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { BonLivraison, Client, Settings } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
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
  colDescription: {
    flex: 3,
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
    minWidth: 250,
  },
  totalLabel: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 20,
    color: '#666',
  },
  totalValue: {
    width: 100,
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
    minWidth: 250,
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
    width: 100,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2d5016',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 50,
    paddingTop: 20,
  },
  signatureBox: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 10,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
});

interface BonLivraisonPDFProps {
  bl: BonLivraison;
  client: Client;
  settings: Settings;
}

export const BonLivraisonPDF = ({ bl, client, settings }: BonLivraisonPDFProps) => (
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
          <Text style={styles.documentTitle}>BON DE LIVRAISON</Text>
          <Text style={styles.documentNumber}>{bl.number}</Text>
          <Text style={styles.documentDate}>
            Date: {format(new Date(bl.date), 'dd MMMM yyyy', { locale: fr })}
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

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colDescription}>Désignation</Text>
          <Text style={styles.colQty}>Quantité (L)</Text>
          <Text style={styles.colPrice}>Prix Unit. (DT)</Text>
          <Text style={styles.colTotal}>Total (DT)</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.colDescription}>Huile d'olive vierge</Text>
          <Text style={styles.colQty}>{bl.quantite.toLocaleString('fr-FR')}</Text>
          <Text style={styles.colPrice}>{bl.prixUnitaire.toFixed(3)}</Text>
          <Text style={styles.colTotal}>{bl.montantHT.toFixed(3)}</Text>
        </View>
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total HT:</Text>
          <Text style={styles.totalValue}>{bl.montantHT.toFixed(3)} DT</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TVA ({bl.tauxTVA}%):</Text>
          <Text style={styles.totalValue}>{bl.montantTVA.toFixed(3)} DT</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Droit de Timbre:</Text>
          <Text style={styles.totalValue}>{bl.droitTimbre.toFixed(3)} DT</Text>
        </View>
        <View style={styles.grandTotal}>
          <Text style={styles.grandTotalLabel}>Total TTC:</Text>
          <Text style={styles.grandTotalValue}>{bl.montantTTC.toFixed(3)} DT</Text>
        </View>
      </View>

      {/* Signature Section */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Signature du Vendeur</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Signature du Client</Text>
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
