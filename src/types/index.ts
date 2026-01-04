export type TransactionType = 'facon' | 'bawaza' | 'achat_base';

export type ClientOperationType = 'capital_fdr' | 'avance' | 'br_reception';

export interface ClientOperation {
  id: string;
  clientId: string;
  type: ClientOperationType;
  date: Date;
  libelle: string;
  montantDT?: number;
  quantiteKg?: number;
  reference?: string; // BR number, etc.
  observations?: string;
  receiptNumber?: string; // Auto-generated receipt number
  createdAt: Date;
}

// Deleted operation history tracking
export interface DeletedOperation {
  id: string;
  originalId: string;
  clientId: string;
  clientName: string;
  type: ClientOperationType;
  date: Date;
  libelle: string;
  montantDT?: number;
  receiptNumber?: string;
  deletedAt: Date;
  deletedReason?: string;
}

export interface Client {
  id: string;
  code: string;
  name: string;
  transactionType: TransactionType;
  phone?: string;
  observations?: string;
  createdAt: Date;
}

export type BRStatus = 'open' | 'closed';

export interface BonReception {
  id: string;
  number: string;
  date: Date;
  clientId: string;
  client?: Client;
  poidsPlein: number;
  poidsVide: number;
  poidsNet: number;
  vehicle?: string;
  observations?: string;
  status: BRStatus;
  createdAt: Date;
}

export interface Trituration {
  id: string;
  brId: string;
  br?: BonReception;
  date: Date;
  quantiteHuile: number;
  observations?: string;
  createdAt: Date;
}

export type ReservoirStatus = 'disponible' | 'plein' | 'indisponible';

export interface Reservoir {
  id: string;
  code: string;
  capaciteMax: number;
  quantiteActuelle: number;
  status: ReservoirStatus;
  observations?: string;
  createdAt: Date;
}

export interface StockAffectation {
  id: string;
  brId: string;
  reservoirId: string;
  quantite: number;
  date: Date;
}

export type StockMovementType = 'entree' | 'sortie_vente' | 'transfert_in' | 'transfert_out';

export interface StockMovement {
  id: string;
  reservoirId: string;
  type: StockMovementType;
  quantite: number;
  date: Date;
  reference?: string; // BR number, BL number, or transfer reference
  clientId?: string; // For sales
  prixUnitaire?: number; // For sales
  tauxTVA?: number; // For sales
  droitTimbre?: number; // For sales
  linkedReservoirId?: string; // For transfers
  createdAt: Date;
}

export type BLPaymentStatus = 'en_attente' | 'paye';

export interface BLPayment {
  date: Date;
  modePayment: PaymentMode;
  reference?: string;
  observations?: string;
}

export interface BonLivraison {
  id: string;
  number: string;
  date: Date;
  clientId: string;
  client?: Client;
  reservoirId: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number;
  droitTimbre: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  invoiced?: boolean;
  paymentStatus: BLPaymentStatus;
  payment?: BLPayment;
  createdAt: Date;
}

export interface Settings {
  companyName: string;
  address?: string;
  phone?: string;
  defaultPrixFacon: number;
  defaultPrixBase: number;
  partHuilerieBawaza: number; // percentage
}

export type InvoiceStatus = 'en_attente' | 'partiellement_paye' | 'paye';
export type InvoiceSource = 'br' | 'bl'; // Source: BR (Façon) or BL (Vente stock)

export interface InvoiceLine {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: Date;
  echeance: Date;
  clientId: string;
  client?: Client;
  source: InvoiceSource;
  sourceId: string; // BR id or BL id
  sourceNumber?: string; // BR number or BL number for display
  lignes: InvoiceLine[];
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  droitTimbre: number;
  montantTTC: number;
  montantPaye: number;
  resteAPayer: number;
  status: InvoiceStatus;
  observations?: string;
  createdAt: Date;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  montant: number;
  modePayment: string;
  date: Date;
  reference?: string;
  observations?: string;
  createdAt: Date;
}

// Payment Module Types
export type PaymentMode = 'especes' | 'virement' | 'compensation';

export type PaymentReceiptStatus = 'paid';

export interface PaymentReceiptLine {
  brId: string;
  brNumber: string;
  brDate: Date;
  poidsNet: number;
  quantiteHuile: number;
  prixUnitaire: number;
  montant: number;
}

export interface PaymentReceipt {
  id: string;
  number: string;
  date: Date;
  clientId: string;
  client?: Client;
  transactionType: TransactionType;
  lines: PaymentReceiptLine[];
  totalMontant: number;
  modePayment: PaymentMode;
  observations?: string;
  createdAt: Date;
}
