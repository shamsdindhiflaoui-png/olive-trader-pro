import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { ClientOperation, Client, Settings, ClientOperationType } from '@/types';
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
    marginBottom: 4,
  },
  documentTitleAr: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 8,
    textAlign: 'right',
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
  sectionLabelBilingual: {
    fontSize: 9,
    color: '#666',
    marginBottom: 6,
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
  operationSection: {
    marginBottom: 25,
    padding: 20,
    backgroundColor: '#f0f9e8',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2d5016',
  },
  operationType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 15,
    textAlign: 'center',
  },
  operationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  operationLabel: {
    fontSize: 10,
    color: '#666',
    flex: 1,
  },
  operationValue: {
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  amountSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#2d5016',
    borderRadius: 4,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 10,
    color: '#ffffff',
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
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
  signatureSection: {
    marginTop: 50,
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
    marginBottom: 40,
    textAlign: 'center',
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
});

const operationTypeLabels: Record<ClientOperationType, { fr: string; ar: string }> = {
  capital_fdr: { fr: 'Capital FDR', ar: 'رأس المال' },
  avance: { fr: 'Avance', ar: 'تسبقة' },
  br_reception: { fr: 'BR Reçu', ar: 'وصل استلام' },
};

interface CapitalAvanceReceiptPDFProps {
  operation: ClientOperation;
  client: Client;
  settings: Settings;
  receiptNumber: string;
}

export const CapitalAvanceReceiptPDF = ({ operation, client, settings, receiptNumber }: CapitalAvanceReceiptPDFProps) => (
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
          <Text style={styles.documentTitle}>REÇU | وصل</Text>
          <Text style={styles.documentTitleAr}>
            {operation.type === 'capital_fdr' ? 'رأس المال' : 'تسبقة'}
          </Text>
          <Text style={styles.documentNumber}>{receiptNumber}</Text>
          <Text style={styles.documentDate}>
            Date: {format(new Date(operation.date), 'dd MMMM yyyy', { locale: fr })}
          </Text>
        </View>
      </View>

      {/* Client Info */}
      <View style={styles.clientSection}>
        <Text style={styles.sectionLabelBilingual}>Client | الحريف</Text>
        <Text style={styles.clientName}>{client.name}</Text>
        <Text style={styles.clientCode}>Code: {client.code}</Text>
        {client.phone && <Text style={styles.clientCode}>Tél: {client.phone}</Text>}
      </View>

      {/* Operation Details */}
      <View style={styles.operationSection}>
        <Text style={styles.operationType}>
          {operationTypeLabels[operation.type].fr} | {operationTypeLabels[operation.type].ar}
        </Text>
        
        <View style={styles.operationRow}>
          <Text style={styles.operationLabel}>Date | التاريخ</Text>
          <Text style={styles.operationValue}>
            {format(new Date(operation.date), 'dd/MM/yyyy', { locale: fr })}
          </Text>
        </View>
        
        <View style={styles.operationRow}>
          <Text style={styles.operationLabel}>Libellé | البيان</Text>
          <Text style={styles.operationValue}>{operation.libelle}</Text>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Montant | المبلغ</Text>
          <Text style={styles.amountValue}>
            {(operation.montantDT || 0).toFixed(3)} DT
          </Text>
        </View>
      </View>

      {/* Observations */}
      {operation.observations && (
        <View style={styles.observations}>
          <Text style={styles.observationsLabel}>Observations | ملاحظات:</Text>
          <Text style={styles.observationsText}>{operation.observations}</Text>
        </View>
      )}

      {/* Signatures */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Signature Client | إمضاء الحريف</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Cachet et Signature | ختم وإمضاء</Text>
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
