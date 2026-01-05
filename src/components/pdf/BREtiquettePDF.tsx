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
    padding: 4,
    fontFamily: 'Amiri',
    fontSize: 6,
  },
  container: {
    border: '1pt dashed #333',
    padding: 4,
    borderRadius: 2,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
    borderBottom: '0.5pt solid #333',
    paddingBottom: 2,
  },
  brNumber: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateTime: {
    fontSize: 5,
    textAlign: 'right',
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
    gap: 6,
  },
  clientSection: {
    flex: 1,
  },
  label: {
    fontSize: 5,
    color: '#666',
  },
  value: {
    fontSize: 7,
    fontWeight: 'bold',
  },
  weightSection: {
    backgroundColor: '#f0f0f0',
    padding: 3,
    borderRadius: 2,
    alignItems: 'center',
    minWidth: 50,
  },
  weightLabel: {
    fontSize: 4,
    color: '#666',
  },
  weightValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  natureBadge: {
    padding: '1 3',
    borderRadius: 2,
    fontSize: 4,
    marginTop: 1,
  },
  serviceBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  bawazBadge: {
    backgroundColor: '#ffedd5',
    color: '#9a3412',
  },
  qrSection: {
    width: 22,
    height: 22,
    marginLeft: 4,
  },
  qrImage: {
    width: 22,
    height: 22,
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
      <Page size={[170, 85]} style={styles.page}>
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
                <View style={[styles.natureBadge, nature === 'service' ? styles.serviceBadge : styles.bawazBadge]}>
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
