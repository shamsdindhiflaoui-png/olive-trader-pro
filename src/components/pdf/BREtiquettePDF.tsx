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
    padding: 10,
    fontFamily: 'Amiri',
    fontSize: 10,
  },
  container: {
    border: '2pt dashed #333',
    padding: 12,
    borderRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottom: '1pt solid #333',
    paddingBottom: 8,
  },
  brNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateTime: {
    fontSize: 9,
    textAlign: 'right',
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoSection: {
    flex: 1,
  },
  qrSection: {
    width: 60,
    height: 60,
    marginLeft: 10,
  },
  qrImage: {
    width: 60,
    height: 60,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingVertical: 4,
  },
  label: {
    fontSize: 9,
    color: '#666',
  },
  value: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  weightSection: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    marginTop: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  weightLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  weightValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  natureBadge: {
    padding: '3 6',
    borderRadius: 4,
    fontSize: 7,
    marginTop: 4,
  },
  serviceBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  bawazBadge: {
    backgroundColor: '#ffedd5',
    color: '#9a3412',
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
  const formattedTime = format(date, 'HH:mm:ss');

  return (
    <Document>
      <Page size={[226, 170]} style={styles.page}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.brNumber}>{brNumber}</Text>
            <View>
              <Text style={styles.dateTime}>{formattedDate}</Text>
              <Text style={styles.dateTime}>{formattedTime}</Text>
            </View>
          </View>

          <View style={styles.mainContent}>
            <View style={styles.infoSection}>
              <View style={styles.row}>
                <Text style={styles.label}>Client:</Text>
                <Text style={styles.value}>{clientName}</Text>
              </View>

              <View style={styles.weightSection}>
                <Text style={styles.weightLabel}>Poids Net</Text>
                <Text style={styles.weightValue}>{poidsNet.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} Kg</Text>
                <View style={[styles.natureBadge, nature === 'service' ? styles.serviceBadge : styles.bawazBadge]}>
                  <Text>{nature === 'service' ? 'Service' : 'Bawaz'}</Text>
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
