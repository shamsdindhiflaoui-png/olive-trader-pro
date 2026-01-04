import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Reservoir, Settings } from '@/types';

// Register Amiri font for Arabic support
Font.register({
  family: 'Amiri',
  src: 'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUpvrIw74NL.ttf',
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Amiri',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottom: '2px solid #d4a574',
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#5c4a3d',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#d4a574',
  },
  titleAr: {
    fontSize: 12,
    color: '#8b7355',
    marginTop: 3,
  },
  reservoirInfo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#faf8f5',
    borderRadius: 5,
  },
  reservoirCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5c4a3d',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  infoBox: {
    width: '30%',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 4,
    textAlign: 'center',
  },
  infoLabel: {
    fontSize: 8,
    color: '#8b7355',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5c4a3d',
  },
  costSummary: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff8f0',
    borderRadius: 5,
    borderLeft: '4px solid #d4a574',
  },
  costTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#c68a4a',
    marginBottom: 10,
  },
  costGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  costBox: {
    width: '32%',
    textAlign: 'center',
  },
  costLabel: {
    fontSize: 8,
    color: '#c68a4a',
    marginBottom: 3,
  },
  costValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8b5a2b',
  },
  avgPriceBox: {
    backgroundColor: '#ffeedd',
    padding: 8,
    borderRadius: 4,
  },
  avgPriceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8b5a2b',
  },
  tableSection: {
    marginTop: 10,
  },
  tableTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#5c4a3d',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f0e8',
    borderBottom: '1px solid #d4a574',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #eee',
    paddingVertical: 6,
    paddingHorizontal: 5,
  },
  tableFooter: {
    flexDirection: 'row',
    backgroundColor: '#fff8f0',
    borderTop: '2px solid #d4a574',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  colDate: { width: '15%' },
  colBR: { width: '12%' },
  colClient: { width: '25%' },
  colQte: { width: '16%', textAlign: 'right' },
  colPrix: { width: '16%', textAlign: 'right' },
  colMontant: { width: '16%', textAlign: 'right' },
  headerText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#5c4a3d',
  },
  cellText: {
    fontSize: 9,
  },
  cellTextBold: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8b5a2b',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    borderTop: '1px solid #d4a574',
    paddingTop: 10,
  },
  footerDate: {
    fontSize: 8,
    color: '#8b7355',
  },
  emptyMessage: {
    textAlign: 'center',
    padding: 30,
    color: '#8b7355',
    fontSize: 11,
  },
});

interface ReservoirStockEntry {
  brNumber: string;
  clientName: string;
  date: Date;
  quantite: number;
  prixUnitaire: number;
  montant: number;
}

interface ReservoirCostPDFProps {
  reservoir: Reservoir;
  entries: ReservoirStockEntry[];
  totalQuantiteAchetee: number;
  totalMontant: number;
  prixMoyen: number;
  settings: Settings;
}

export const ReservoirCostPDF = ({
  reservoir,
  entries,
  totalQuantiteAchetee,
  totalMontant,
  prixMoyen,
  settings,
}: ReservoirCostPDFProps) => {
  const formatNumber = (num: number) => num.toLocaleString('fr-FR', { minimumFractionDigits: 3 });
  const percentage = (reservoir.quantiteActuelle / reservoir.capaciteMax) * 100;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{settings.companyName}</Text>
          <Text style={styles.title}>Détail Coût du Réservoir</Text>
          <Text style={styles.titleAr}>تفاصيل تكلفة الخزان</Text>
        </View>

        {/* Reservoir Info */}
        <View style={styles.reservoirInfo}>
          <Text style={styles.reservoirCode}>{reservoir.code}</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Capacité Max | السعة القصوى</Text>
              <Text style={styles.infoValue}>{formatNumber(reservoir.capaciteMax)} L</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Quantité Actuelle | الكمية الحالية</Text>
              <Text style={styles.infoValue}>{formatNumber(reservoir.quantiteActuelle)} L</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Taux Remplissage | نسبة الامتلاء</Text>
              <Text style={styles.infoValue}>{percentage.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* Cost Summary */}
        <View style={styles.costSummary}>
          <Text style={styles.costTitle}>💸 Coût du Stock (BR Bawaz) | تكلفة المخزون (وصولات الباواز)</Text>
          <View style={styles.costGrid}>
            <View style={styles.costBox}>
              <Text style={styles.costLabel}>Quantité achetée | الكمية المشتراة</Text>
              <Text style={styles.costValue}>{formatNumber(totalQuantiteAchetee)} L</Text>
            </View>
            <View style={styles.costBox}>
              <Text style={styles.costLabel}>Montant total | المبلغ الإجمالي</Text>
              <Text style={styles.costValue}>{formatNumber(totalMontant)} DT</Text>
            </View>
            <View style={[styles.costBox, styles.avgPriceBox]}>
              <Text style={styles.costLabel}>Prix moyen/Kg | متوسط السعر/كغ</Text>
              <Text style={styles.avgPriceValue}>
                {prixMoyen > 0 ? `${formatNumber(prixMoyen)} DT` : '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Affectations Table */}
        <View style={styles.tableSection}>
          <Text style={styles.tableTitle}>Détail des affectations (Bawaz) | تفاصيل التخصيصات (الباواز)</Text>
          
          {entries.length === 0 ? (
            <Text style={styles.emptyMessage}>
              Aucune affectation bawaz avec prix | لا توجد تخصيصات باواز بأسعار
            </Text>
          ) : (
            <View style={styles.table}>
              {/* Header */}
              <View style={styles.tableHeader}>
                <View style={styles.colDate}>
                  <Text style={styles.headerText}>Date | التاريخ</Text>
                </View>
                <View style={styles.colBR}>
                  <Text style={styles.headerText}>BR | الوصل</Text>
                </View>
                <View style={styles.colClient}>
                  <Text style={styles.headerText}>Client | الحريف</Text>
                </View>
                <View style={styles.colQte}>
                  <Text style={styles.headerText}>Quantité | الكمية</Text>
                </View>
                <View style={styles.colPrix}>
                  <Text style={styles.headerText}>Prix/Kg | السعر/كغ</Text>
                </View>
                <View style={styles.colMontant}>
                  <Text style={styles.headerText}>Montant | المبلغ</Text>
                </View>
              </View>

              {/* Rows */}
              {entries.map((entry, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <View style={styles.colDate}>
                    <Text style={styles.cellText}>
                      {format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr })}
                    </Text>
                  </View>
                  <View style={styles.colBR}>
                    <Text style={styles.cellTextBold}>{entry.brNumber}</Text>
                  </View>
                  <View style={styles.colClient}>
                    <Text style={styles.cellText}>{entry.clientName}</Text>
                  </View>
                  <View style={styles.colQte}>
                    <Text style={styles.cellText}>{formatNumber(entry.quantite)} L</Text>
                  </View>
                  <View style={styles.colPrix}>
                    <Text style={styles.cellText}>{formatNumber(entry.prixUnitaire)} DT</Text>
                  </View>
                  <View style={styles.colMontant}>
                    <Text style={styles.cellTextBold}>{formatNumber(entry.montant)} DT</Text>
                  </View>
                </View>
              ))}

              {/* Footer */}
              <View style={styles.tableFooter}>
                <View style={styles.colDate}>
                  <Text style={styles.footerText}>TOTAL</Text>
                </View>
                <View style={styles.colBR}>
                  <Text style={styles.footerText}></Text>
                </View>
                <View style={styles.colClient}>
                  <Text style={styles.footerText}>المجموع</Text>
                </View>
                <View style={styles.colQte}>
                  <Text style={styles.footerText}>{formatNumber(totalQuantiteAchetee)} L</Text>
                </View>
                <View style={styles.colPrix}>
                  <Text style={styles.footerText}>{prixMoyen > 0 ? `${formatNumber(prixMoyen)} DT` : '-'}</Text>
                </View>
                <View style={styles.colMontant}>
                  <Text style={styles.footerText}>{formatNumber(totalMontant)} DT</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerDate}>
            Document généré le {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })} | تم إنشاء الوثيقة في {format(new Date(), 'dd/MM/yyyy HH:mm')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
