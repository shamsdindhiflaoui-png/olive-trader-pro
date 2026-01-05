import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Register Arabic font
Font.register({
  family: 'Amiri',
  src: 'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUpvrIw74NL.ttf'
});

const styles = StyleSheet.create({
  page: {
    padding: 3,
    fontFamily: 'Amiri',
    fontSize: 7,
    backgroundColor: '#ffffff',
  },
  container: {
    border: '1pt solid #000',
    padding: 4,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    borderBottom: '0.5pt solid #000',
    paddingBottom: 2,
  },
  brNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  dateTime: {
    fontSize: 6,
    textAlign: 'right',
    color: '#000',
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  infoSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientSection: {
    flex: 1,
  },
  label: {
    fontSize: 6,
    color: '#000',
  },
  value: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
  },
  weightSection: {
    border: '0.5pt solid #000',
    padding: 3,
    alignItems: 'center',
    minWidth: 55,
  },
  weightLabel: {
    fontSize: 5,
    color: '#000',
  },
  weightValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
  },
  natureBadge: {
    padding: '1 4',
    border: '0.5pt solid #000',
    fontSize: 5,
    marginTop: 1,
    color: '#000',
  },
  qrSection: {
    width: 26,
    height: 26,
    marginLeft: 4,
  },
  qrImage: {
    width: 26,
    height: 26,
  },
});

interface BREtiquettePDFProps {
  brNumber: string;
  clientName: string;
  poidsNet: number;
  date: Date;
  nature: 'service' | 'bawaz';
  qrCodeDataUrl?: string;
}

export function BREtiquettePDF({ brNumber, clientName, poidsNet, date, nature, qrCodeDataUrl }: BREtiquettePDFProps) {
  const formattedDate = format(date, 'dd/MM/yyyy', { locale: fr });
  const formattedTime = format(date, 'HH:mm');

  return (
    <Document>
      <Page size={[198, 85]} style={styles.page}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.brNumber}>{brNumber}</Text>
            <View>
              <Text style={styles.dateTime}>{formattedDate} {formattedTime}</Text>
            </View>
          </View>

          <View style={styles.mainContent}>
            <View style={styles.infoSection}>
              <View style={styles.clientSection}>
                <Text style={styles.label}>Client:</Text>
                <Text style={styles.value}>{clientName}</Text>
              </View>

              <View style={styles.weightSection}>
                <Text style={styles.weightLabel}>Poids Net</Text>
                <Text style={styles.weightValue}>{poidsNet.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</Text>
                <View style={styles.natureBadge}>
                  <Text>{nature === 'service' ? 'Svc' : 'Bwz'}</Text>
                </View>
              </View>
            </View>

            {qrCodeDataUrl && (
              <View style={styles.qrSection}>
                <Image style={styles.qrImage} src={qrCodeDataUrl} />
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
