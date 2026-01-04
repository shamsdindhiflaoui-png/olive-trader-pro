import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
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
    padding: 10,
    marginTop: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  weightLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  natureBadge: {
    padding: '4 8',
    borderRadius: 4,
    fontSize: 8,
    marginTop: 6,
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
}

export function BREtiquettePDF({ brNumber, clientName, poidsNet, date, nature }: BREtiquettePDFProps) {
  const formattedDate = format(date, 'dd/MM/yyyy', { locale: fr });
  const formattedTime = format(date, 'HH:mm:ss');

  return (
    <Document>
      <Page size={[226, 150]} style={styles.page}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.brNumber}>{brNumber}</Text>
            <View>
              <Text style={styles.dateTime}>{formattedDate}</Text>
              <Text style={styles.dateTime}>{formattedTime}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Client / الحريف:</Text>
            <Text style={styles.value}>{clientName}</Text>
          </View>

          <View style={styles.weightSection}>
            <Text style={styles.weightLabel}>Poids Net / الوزن الصافي</Text>
            <Text style={styles.weightValue}>{poidsNet.toLocaleString()} Kg</Text>
            <View style={[styles.natureBadge, nature === 'service' ? styles.serviceBadge : styles.bawazBadge]}>
              <Text>{nature === 'service' ? 'Service / خدمة' : 'Bawaz / باواز'}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
