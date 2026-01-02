export type TransactionType = 'facon' | 'bawaza' | 'achat_base';

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
  createdAt: Date;
}

export type PaymentStatus = 'non_paye' | 'paye';

export interface Payment {
  id: string;
  brId: string;
  br?: BonReception;
  trituration?: Trituration;
  montant: number;
  prixUnitaire: number;
  modePayment: string;
  date: Date;
  status: PaymentStatus;
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
