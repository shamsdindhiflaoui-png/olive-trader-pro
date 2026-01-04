import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Register Amiri font for Arabic
Font.register({
  family: 'Amiri',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUpvrIw74NL.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/amiri/v27/J7afnpd8CGxBHpUrtLYS6pNLAjk.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Amiri',
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#1e3a8a',
  },
  titleAr: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#475569',
    direction: 'rtl',
  },
  dateText: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    textAlign: 'center',
  },
  statBoxBlue: {
    backgroundColor: '#dbeafe',
  },
  statBoxGreen: {
    backgroundColor: '#dcfce7',
  },
  statBoxOrange: {
    backgroundColor: '#fed7aa',
  },
  statBoxPurple: {
    backgroundColor: '#e9d5ff',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 8,
    color: '#64748b',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    padding: 8,
    borderRadius: 3,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
  },
  tableCellRight: {
    fontSize: 9,
    textAlign: 'right',
  },
  tableFooter: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#1e40af',
    borderRadius: 3,
    marginTop: 5,
  },
  tableFooterCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  colCode: { width: '10%' },
  colNom: { width: '22%' },
  colType: { width: '12%' },
  colNbBL: { width: '8%', textAlign: 'right' },
  colQty: { width: '12%', textAlign: 'right' },
  colTTC: { width: '14%', textAlign: 'right' },
  colPaye: { width: '12%', textAlign: 'right' },
  colAttente: { width: '10%', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
});

interface ClientGrosData {
  code: string;
  raisonSociale: string;
  clientType: string;
  nbBL: number;
  totalQuantite: number;
  totalTTC: number;
  totalPaye: number;
  totalEnAttente: number;
}

interface AllClientsGrosExtraitPDFProps {
  clients: ClientGrosData[];
  companyName?: string;
}

const formatNumber = (num: number) => {
  return num.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
};

const clientTypeLabels: Record<string, string> = {
  grossiste: 'Grossiste',
  exportateur: 'Exportateur',
  societe: 'Société',
  autre: 'Autre',
};

export function AllClientsGrosExtraitPDF({ clients, companyName }: AllClientsGrosExtraitPDFProps) {
  const now = new Date();
  
  // Calculate global totals
  const totals = clients.reduce(
    (acc, c) => ({
      nbBL: acc.nbBL + c.nbBL,
      totalQuantite: acc.totalQuantite + c.totalQuantite,
      totalTTC: acc.totalTTC + c.totalTTC,
      totalPaye: acc.totalPaye + c.totalPaye,
      totalEnAttente: acc.totalEnAttente + c.totalEnAttente,
    }),
    { nbBL: 0, totalQuantite: 0, totalTTC: 0, totalPaye: 0, totalEnAttente: 0 }
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{companyName || 'Huilerie'}</Text>
            <Text style={styles.dateText}>
              Généré le: {format(now, 'dd/MM/yyyy HH:mm', { locale: fr })}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'right', direction: 'rtl' }}>
              مستخرج مبيعات الجملة
            </Text>
            <Text style={{ fontSize: 10, textAlign: 'right', color: '#64748b' }}>
              Extrait Ventes en Gros
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>EXTRAIT GÉNÉRAL - VENTES EN GROS</Text>
        <Text style={styles.titleAr}>المستخرج العام - مبيعات الجملة</Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, styles.statBoxPurple]}>
            <Text style={[styles.statValue, { color: '#7c3aed' }]}>{clients.length}</Text>
            <Text style={styles.statLabel}>Clients | حرفاء</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxBlue]}>
            <Text style={[styles.statValue, { color: '#1d4ed8' }]}>{formatNumber(totals.totalQuantite)} kg</Text>
            <Text style={styles.statLabel}>Quantité totale | الكمية</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxGreen]}>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{formatNumber(totals.totalPaye)} DT</Text>
            <Text style={styles.statLabel}>Total payé | المدفوع</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxOrange]}>
            <Text style={[styles.statValue, { color: '#ea580c' }]}>{formatNumber(totals.totalEnAttente)} DT</Text>
            <Text style={styles.statLabel}>En attente | معلق</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colCode]}>Code</Text>
            <Text style={[styles.tableHeaderCell, styles.colNom]}>Raison sociale</Text>
            <Text style={[styles.tableHeaderCell, styles.colType]}>Type</Text>
            <Text style={[styles.tableHeaderCell, styles.colNbBL]}>BL</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qté (kg)</Text>
            <Text style={[styles.tableHeaderCell, styles.colTTC]}>Total TTC</Text>
            <Text style={[styles.tableHeaderCell, styles.colPaye]}>Payé</Text>
            <Text style={[styles.tableHeaderCell, styles.colAttente]}>Attente</Text>
          </View>
          
          {clients.map((client, index) => (
            <View key={client.code} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.colCode]}>{client.code}</Text>
              <Text style={[styles.tableCell, styles.colNom]}>{client.raisonSociale}</Text>
              <Text style={[styles.tableCell, styles.colType]}>{clientTypeLabels[client.clientType] || client.clientType}</Text>
              <Text style={[styles.tableCellRight, styles.colNbBL]}>{client.nbBL}</Text>
              <Text style={[styles.tableCellRight, styles.colQty]}>{formatNumber(client.totalQuantite)}</Text>
              <Text style={[styles.tableCellRight, styles.colTTC]}>{formatNumber(client.totalTTC)}</Text>
              <Text style={[styles.tableCellRight, styles.colPaye, { color: '#16a34a' }]}>{formatNumber(client.totalPaye)}</Text>
              <Text style={[styles.tableCellRight, styles.colAttente, { color: '#ea580c' }]}>{formatNumber(client.totalEnAttente)}</Text>
            </View>
          ))}

          {/* Footer totals */}
          <View style={styles.tableFooter}>
            <Text style={[styles.tableFooterCell, styles.colCode]}>TOTAL</Text>
            <Text style={[styles.tableFooterCell, styles.colNom]}>{clients.length} clients</Text>
            <Text style={[styles.tableFooterCell, styles.colType]}></Text>
            <Text style={[styles.tableFooterCell, styles.colNbBL, { textAlign: 'right' }]}>{totals.nbBL}</Text>
            <Text style={[styles.tableFooterCell, styles.colQty, { textAlign: 'right' }]}>{formatNumber(totals.totalQuantite)}</Text>
            <Text style={[styles.tableFooterCell, styles.colTTC, { textAlign: 'right' }]}>{formatNumber(totals.totalTTC)}</Text>
            <Text style={[styles.tableFooterCell, styles.colPaye, { textAlign: 'right' }]}>{formatNumber(totals.totalPaye)}</Text>
            <Text style={[styles.tableFooterCell, styles.colAttente, { textAlign: 'right' }]}>{formatNumber(totals.totalEnAttente)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {companyName || 'Huilerie'} - Extrait généré automatiquement | مستخرج تلقائي
          </Text>
        </View>
      </Page>
    </Document>
  );
}
