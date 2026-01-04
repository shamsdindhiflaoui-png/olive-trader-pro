import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { ClientGros, BonLivraison } from '@/types';
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
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
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
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'right',
  },
  clientInfo: {
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  clientInfoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  clientLabel: {
    width: 120,
    fontSize: 9,
    color: '#64748b',
  },
  clientValue: {
    fontSize: 10,
    fontWeight: 'bold',
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
    backgroundColor: '#1e3a8a',
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
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginTop: 5,
  },
  tableFooterCell: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  colBL: { width: '12%' },
  colDate: { width: '12%' },
  colQty: { width: '12%', textAlign: 'right' },
  colPrix: { width: '12%', textAlign: 'right' },
  colHT: { width: '14%', textAlign: 'right' },
  colTVA: { width: '12%', textAlign: 'right' },
  colTTC: { width: '14%', textAlign: 'right' },
  colStatus: { width: '12%', textAlign: 'center' },
  statusPaid: {
    color: '#16a34a',
    fontSize: 8,
  },
  statusPending: {
    color: '#ea580c',
    fontSize: 8,
  },
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
  bilingualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

interface ClientGrosExtraitPDFProps {
  client: ClientGros;
  bonsLivraison: BonLivraison[];
  totals: {
    totalQuantite: number;
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    totalPaye: number;
    totalEnAttente: number;
  };
  companyName?: string;
}

const formatNumber = (num: number) => {
  return num.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
};

const clientTypeLabels: Record<string, { fr: string; ar: string }> = {
  grossiste: { fr: 'Grossiste', ar: 'تاجر جملة' },
  exportateur: { fr: 'Exportateur', ar: 'مصدّر' },
  societe: { fr: 'Société', ar: 'شركة' },
  autre: { fr: 'Autre', ar: 'آخر' },
};

export function ClientGrosExtraitPDF({ client, bonsLivraison, totals, companyName }: ClientGrosExtraitPDFProps) {
  const now = new Date();

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
              مستخرج حريف الجملة
            </Text>
            <Text style={{ fontSize: 10, textAlign: 'right', color: '#64748b' }}>
              Extrait Client Gros
            </Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.bilingualHeader}>
          <Text style={styles.title}>EXTRAIT DE COMPTE</Text>
          <Text style={{ fontSize: 14, fontWeight: 'bold', direction: 'rtl' }}>مستخرج الحساب</Text>
        </View>
        <Text style={styles.subtitle}>{client.raisonSociale} ({client.code})</Text>

        {/* Client Info */}
        <View style={styles.clientInfo}>
          <View style={styles.clientInfoRow}>
            <Text style={styles.clientLabel}>Type | النوع:</Text>
            <Text style={styles.clientValue}>
              {clientTypeLabels[client.clientType]?.fr} | {clientTypeLabels[client.clientType]?.ar}
            </Text>
          </View>
          {client.matriculeFiscal && (
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientLabel}>Matricule fiscal | المعرف الجبائي:</Text>
              <Text style={styles.clientValue}>{client.matriculeFiscal}</Text>
            </View>
          )}
          {client.phone && (
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientLabel}>Téléphone | الهاتف:</Text>
              <Text style={styles.clientValue}>{client.phone}</Text>
            </View>
          )}
          {client.email && (
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientLabel}>Email | البريد:</Text>
              <Text style={styles.clientValue}>{client.email}</Text>
            </View>
          )}
          {client.adresse && (
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientLabel}>Adresse | العنوان:</Text>
              <Text style={styles.clientValue}>{client.adresse}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, styles.statBoxBlue]}>
            <Text style={[styles.statValue, { color: '#1d4ed8' }]}>{formatNumber(totals.totalQuantite)} kg</Text>
            <Text style={styles.statLabel}>Quantité totale | الكمية الإجمالية</Text>
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
            <Text style={[styles.tableHeaderCell, styles.colBL]}>N° BL</Text>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qté (kg)</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrix]}>Prix U.</Text>
            <Text style={[styles.tableHeaderCell, styles.colHT]}>HT (DT)</Text>
            <Text style={[styles.tableHeaderCell, styles.colTVA]}>TVA</Text>
            <Text style={[styles.tableHeaderCell, styles.colTTC]}>TTC (DT)</Text>
            <Text style={[styles.tableHeaderCell, styles.colStatus]}>Statut</Text>
          </View>
          
          {bonsLivraison.map((bl, index) => (
            <View key={bl.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.colBL]}>{bl.number}</Text>
              <Text style={[styles.tableCell, styles.colDate]}>
                {format(new Date(bl.date), 'dd/MM/yyyy')}
              </Text>
              <Text style={[styles.tableCellRight, styles.colQty]}>{formatNumber(bl.quantite)}</Text>
              <Text style={[styles.tableCellRight, styles.colPrix]}>{formatNumber(bl.prixUnitaire)}</Text>
              <Text style={[styles.tableCellRight, styles.colHT]}>{formatNumber(bl.montantHT)}</Text>
              <Text style={[styles.tableCellRight, styles.colTVA]}>{formatNumber(bl.montantTVA)}</Text>
              <Text style={[styles.tableCellRight, styles.colTTC]}>{formatNumber(bl.montantTTC)}</Text>
              <Text style={bl.paymentStatus === 'paye' ? styles.statusPaid : styles.statusPending}>
                {bl.paymentStatus === 'paye' ? 'Payé' : 'En attente'}
              </Text>
            </View>
          ))}

          {/* Footer totals */}
          <View style={styles.tableFooter}>
            <Text style={[styles.tableFooterCell, styles.colBL]}>TOTAL</Text>
            <Text style={[styles.tableFooterCell, styles.colDate]}>{bonsLivraison.length} BL</Text>
            <Text style={[styles.tableFooterCell, styles.colQty, { textAlign: 'right' }]}>
              {formatNumber(totals.totalQuantite)}
            </Text>
            <Text style={[styles.tableFooterCell, styles.colPrix]}></Text>
            <Text style={[styles.tableFooterCell, styles.colHT, { textAlign: 'right' }]}>
              {formatNumber(totals.totalHT)}
            </Text>
            <Text style={[styles.tableFooterCell, styles.colTVA, { textAlign: 'right' }]}>
              {formatNumber(totals.totalTVA)}
            </Text>
            <Text style={[styles.tableFooterCell, styles.colTTC, { textAlign: 'right' }]}>
              {formatNumber(totals.totalTTC)}
            </Text>
            <Text style={styles.tableFooterCell}></Text>
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
