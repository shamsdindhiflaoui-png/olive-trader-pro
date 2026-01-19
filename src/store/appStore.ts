import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client, ClientGros, ClientGrosType, BonReception, Trituration, Reservoir, Settings, StockAffectation, StockMovement, BonLivraison, Invoice, InvoiceLine, InvoicePayment, InvoiceSource, ClientOperation, PaymentReceipt, PaymentReceiptLine, PaymentMode, BLPayment, DeletedOperation } from '@/types';

interface AppState {
  clients: Client[];
  clientsGros: ClientGros[];
  clientOperations: ClientOperation[];
  deletedOperations: DeletedOperation[];
  bonsReception: BonReception[];
  triturations: Trituration[];
  reservoirs: Reservoir[];
  stockAffectations: StockAffectation[];
  stockMovements: StockMovement[];
  bonsLivraison: BonLivraison[];
  invoices: Invoice[];
  invoicePayments: InvoicePayment[];
  paymentReceipts: PaymentReceipt[];
  settings: Settings;
  
  // Client Détail actions
  addClient: (client: Omit<Client, 'id' | 'code' | 'createdAt'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  // Client Gros actions
  addClientGros: (client: Omit<ClientGros, 'id' | 'code' | 'createdAt'>) => void;
  updateClientGros: (id: string, client: Partial<ClientGros>) => void;
  deleteClientGros: (id: string) => void;
  
  // Client operations (Bawaza)
  addClientOperation: (operation: Omit<ClientOperation, 'id' | 'createdAt' | 'receiptNumber'>) => ClientOperation;
  deleteClientOperation: (id: string, reason?: string) => void;
  getClientOperations: (clientId: string) => ClientOperation[];
  getDeletedOperations: (clientId?: string) => DeletedOperation[];
  
  // BR actions
  addBR: (br: Omit<BonReception, 'id' | 'number' | 'poidsNet' | 'status' | 'createdAt'>) => BonReception;
  getBRCountByNature: (nature: 'service' | 'bawaz') => number;
  updateBR: (id: string, br: Partial<BonReception>) => void;
  closeBR: (id: string) => void;
  
  // Trituration actions
  addTrituration: (trituration: Omit<Trituration, 'id' | 'createdAt'>) => void;
  updateTrituration: (brId: string, data: Partial<Trituration>) => void;
  
  // Reservoir actions
  addReservoir: (reservoir: Omit<Reservoir, 'id' | 'createdAt'>) => void;
  updateReservoir: (id: string, reservoir: Partial<Reservoir>) => void;
  affectToReservoir: (reservoirId: string, quantity: number, sourceId: string, sourceType: 'br' | 'direct') => boolean;
  transferBetweenReservoirs: (fromId: string, toId: string, quantity: number) => boolean;
  updateTriturationById: (triturationId: string, data: Partial<Trituration>) => void;
  
  // Sales actions
  addSale: (sale: { clientId: string; reservoirId: string; quantite: number; prixUnitaire: number; tauxTVA: number; droitTimbre: number; date: Date }) => BonLivraison | null;
  updateBLPayment: (blId: string, payment: BLPayment) => boolean;
  
  // Invoice actions
  addInvoiceFromBR: (data: { brId: string; date: Date; echeance: Date; prixUnitaire: number; tauxTVA: number; droitTimbre: number; observations?: string }) => Invoice | null;
  addInvoiceFromBL: (data: { blId: string; date: Date; echeance: Date; observations?: string }) => Invoice | null;
  updateInvoice: (id: string, data: { date?: Date; echeance?: Date; tauxTVA?: number; droitTimbre?: number; observations?: string }) => boolean;
  addInvoicePayment: (payment: { invoiceId: string; montant: number; modePayment: string; date: Date; reference?: string; observations?: string }) => boolean;
  
  // Payment Receipt actions
  addPaymentReceipt: (data: { clientId: string; items: Array<{ type: 'br' | 'direct'; id: string }>; modePayment: PaymentMode; date: Date; observations?: string }) => PaymentReceipt | null;
  
  // Settings actions
  updateSettings: (settings: Partial<Settings>) => void;
  
  // Clear all data
  clearAllData: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateCode = (prefix: string, count: number) => `${prefix}${String(count + 1).padStart(4, '0')}`;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: [],
      clientsGros: [],
      clientOperations: [],
      deletedOperations: [],
      bonsReception: [],
      triturations: [],
      reservoirs: [],
      stockAffectations: [],
      stockMovements: [],
      bonsLivraison: [],
      invoices: [],
      invoicePayments: [],
      paymentReceipts: [],
      settings: {
        companyName: 'Huilerie Moderne',
        defaultPrixFacon: 0.5,
        defaultPrixBase: 15,
        partHuilerieBawaza: 20,
      },
      
      // Client Détail actions
      addClient: (clientData) => set((state) => ({
        clients: [...state.clients, {
          ...clientData,
          id: generateId(),
          code: generateCode('CLT', state.clients.length),
          createdAt: new Date(),
        }]
      })),
      
      updateClient: (id, clientData) => set((state) => ({
        clients: state.clients.map(c => c.id === id ? { ...c, ...clientData } : c)
      })),
      
      deleteClient: (id) => set((state) => ({
        clients: state.clients.filter(c => c.id !== id)
      })),
      
      // Client Gros actions
      addClientGros: (clientData) => set((state) => ({
        clientsGros: [...state.clientsGros, {
          ...clientData,
          id: generateId(),
          code: generateCode('CLG', state.clientsGros.length),
          createdAt: new Date(),
        }]
      })),
      
      updateClientGros: (id, clientData) => set((state) => ({
        clientsGros: state.clientsGros.map(c => c.id === id ? { ...c, ...clientData } : c)
      })),
      
      deleteClientGros: (id) => set((state) => ({
        clientsGros: state.clientsGros.filter(c => c.id !== id)
      })),
      
      // Client operations (Bawaza - capital FDR, avances)
      addClientOperation: (operationData) => {
        const state = get();
        const receiptPrefix = operationData.type === 'capital_fdr' ? 'REC-CAP' : 'REC-AVA';
        const existingCount = state.clientOperations.filter(op => op.type === operationData.type).length;
        const receiptNumber = `${receiptPrefix}-${String(existingCount + 1).padStart(4, '0')}`;
        
        const newOperation: ClientOperation = {
          ...operationData,
          id: generateId(),
          receiptNumber,
          createdAt: new Date(),
        };
        
        set((state) => ({
          clientOperations: [...state.clientOperations, newOperation]
        }));
        
        return newOperation;
      },
      
      deleteClientOperation: (id, reason) => {
        const state = get();
        const operation = state.clientOperations.find(op => op.id === id);
        if (!operation) return;
        
        const client = state.clients.find(c => c.id === operation.clientId);
        
        const deletedRecord: DeletedOperation = {
          id: generateId(),
          originalId: operation.id,
          clientId: operation.clientId,
          clientName: client?.name || 'Client inconnu',
          type: operation.type,
          date: operation.date,
          libelle: operation.libelle,
          montantDT: operation.montantDT,
          receiptNumber: operation.receiptNumber,
          deletedAt: new Date(),
          deletedReason: reason,
        };
        
        set((state) => ({
          clientOperations: state.clientOperations.filter(op => op.id !== id),
          deletedOperations: [...state.deletedOperations, deletedRecord],
        }));
      },
      
      getClientOperations: (clientId) => {
        return get().clientOperations.filter(op => op.clientId === clientId);
      },
      
      getDeletedOperations: (clientId) => {
        const state = get();
        if (clientId) {
          return state.deletedOperations.filter(op => op.clientId === clientId);
        }
        return state.deletedOperations;
      },
      
      // BR actions
      getBRCountByNature: (nature) => {
        const state = get();
        return state.bonsReception.filter(br => br.nature === nature).length;
      },
      
      addBR: (brData) => {
        const state = get();
        // All BRs are now 'bawaz' type
        const count = state.bonsReception.length;
        const number = `BR${String(count + 1).padStart(4, '0')}`;
        
        const newBR: BonReception = {
          ...brData,
          nature: 'bawaz',
          id: generateId(),
          number,
          poidsNet: brData.poidsPlein - brData.poidsVide,
          status: 'open',
          createdAt: new Date(),
        };
        
        set((state) => ({
          bonsReception: [...state.bonsReception, newBR]
        }));
        
        return newBR;
      },
      
      updateBR: (id, brData) => set((state) => ({
        bonsReception: state.bonsReception.map(br => 
          br.id === id ? { ...br, ...brData } : br
        )
      })),
      
      closeBR: (id) => set((state) => ({
        bonsReception: state.bonsReception.map(br => 
          br.id === id ? { ...br, status: 'closed' } : br
        )
      })),
      
      // Trituration actions
      addTrituration: (tritData) => {
        set((state) => ({
          triturations: [...state.triturations, {
            ...tritData,
            id: generateId(),
            createdAt: new Date(),
          }]
        }));
        // Only close BR if it's a BR-based trituration
        if (tritData.type === 'br' && tritData.brId) {
          get().closeBR(tritData.brId);
        }
      },
      
      updateTrituration: (brId, data) => set((state) => ({
        triturations: state.triturations.map(t => 
          t.brId === brId ? { ...t, ...data } : t
        )
      })),

      updateTriturationById: (triturationId, data) => set((state) => ({
        triturations: state.triturations.map(t => 
          t.id === triturationId ? { ...t, ...data } : t
        )
      })),
      
      // Reservoir actions
      addReservoir: (reservoirData) => set((state) => ({
        reservoirs: [...state.reservoirs, {
          ...reservoirData,
          id: generateId(),
          createdAt: new Date(),
        }]
      })),
      
      updateReservoir: (id, reservoirData) => set((state) => ({
        reservoirs: state.reservoirs.map(r => 
          r.id === id ? { ...r, ...reservoirData } : r
        )
      })),
      
      affectToReservoir: (reservoirId, quantity, sourceId, sourceType) => {
        const state = get();
        const reservoir = state.reservoirs.find(r => r.id === reservoirId);
        if (!reservoir) return false;
        
        const newQuantity = reservoir.quantiteActuelle + quantity;
        if (newQuantity > reservoir.capaciteMax) return false;
        
        // Get reference for stock movement
        let reference: string | undefined;
        if (sourceType === 'br') {
          const br = state.bonsReception.find(b => b.id === sourceId);
          reference = br?.number;
        } else {
          const trit = state.triturations.find(t => t.id === sourceId);
          reference = trit?.numeroLot ? `LOT-${trit.numeroLot}` : `DIRECT-${sourceId.substring(0, 6)}`;
        }
        
        set((state) => ({
          reservoirs: state.reservoirs.map(r => 
            r.id === reservoirId 
              ? { 
                  ...r, 
                  quantiteActuelle: newQuantity,
                  status: newQuantity >= r.capaciteMax ? 'plein' : 'disponible'
                } 
              : r
          ),
          stockAffectations: [...state.stockAffectations, {
            id: generateId(),
            source: sourceType,
            brId: sourceType === 'br' ? sourceId : undefined,
            triturationId: sourceType === 'direct' ? sourceId : undefined,
            reservoirId,
            quantite: quantity,
            date: new Date(),
          }],
          stockMovements: [...state.stockMovements, {
            id: generateId(),
            reservoirId,
            type: 'entree',
            quantite: quantity,
            date: new Date(),
            reference,
            createdAt: new Date(),
          }]
        }));
        return true;
      },
      
      transferBetweenReservoirs: (fromId, toId, quantity) => {
        const state = get();
        const fromReservoir = state.reservoirs.find(r => r.id === fromId);
        const toReservoir = state.reservoirs.find(r => r.id === toId);
        
        if (!fromReservoir || !toReservoir) return false;
        if (fromReservoir.quantiteActuelle < quantity) return false;
        if (toReservoir.quantiteActuelle + quantity > toReservoir.capaciteMax) return false;
        
        const transferRef = `TRF-${Date.now().toString(36).toUpperCase()}`;
        
        set((state) => ({
          reservoirs: state.reservoirs.map(r => {
            if (r.id === fromId) {
              const newQty = r.quantiteActuelle - quantity;
              return { 
                ...r, 
                quantiteActuelle: newQty,
                status: newQty === 0 ? 'disponible' : r.status
              };
            }
            if (r.id === toId) {
              const newQty = r.quantiteActuelle + quantity;
              return { 
                ...r, 
                quantiteActuelle: newQty,
                status: newQty >= r.capaciteMax ? 'plein' : 'disponible'
              };
            }
            return r;
          }),
          stockMovements: [
            ...state.stockMovements,
            {
              id: generateId(),
              reservoirId: fromId,
              type: 'transfert_out',
              quantite: quantity,
              date: new Date(),
              reference: transferRef,
              linkedReservoirId: toId,
              createdAt: new Date(),
            },
            {
              id: generateId(),
              reservoirId: toId,
              type: 'transfert_in',
              quantite: quantity,
              date: new Date(),
              reference: transferRef,
              linkedReservoirId: fromId,
              createdAt: new Date(),
            }
          ]
        }));
        return true;
      },
      
      addSale: (saleData) => {
        const state = get();
        const reservoir = state.reservoirs.find(r => r.id === saleData.reservoirId);
        
        if (!reservoir || reservoir.quantiteActuelle < saleData.quantite) return null;
        
        const montantHT = saleData.quantite * saleData.prixUnitaire;
        const montantTVA = montantHT * (saleData.tauxTVA / 100);
        const montantTTC = montantHT + montantTVA + saleData.droitTimbre;
        
        const bl: BonLivraison = {
          id: generateId(),
          number: generateCode('BL', state.bonsLivraison.length),
          date: saleData.date,
          clientId: saleData.clientId,
          reservoirId: saleData.reservoirId,
          quantite: saleData.quantite,
          prixUnitaire: saleData.prixUnitaire,
          tauxTVA: saleData.tauxTVA,
          droitTimbre: saleData.droitTimbre,
          montantHT,
          montantTVA,
          montantTTC,
          invoiced: false,
          paymentStatus: 'en_attente',
          createdAt: new Date(),
        };
        
        set((state) => ({
          reservoirs: state.reservoirs.map(r => {
            if (r.id === saleData.reservoirId) {
              const newQty = r.quantiteActuelle - saleData.quantite;
              return { 
                ...r, 
                quantiteActuelle: newQty,
                status: newQty === 0 ? 'disponible' : r.status
              };
            }
            return r;
          }),
          bonsLivraison: [...state.bonsLivraison, bl],
          stockMovements: [...state.stockMovements, {
            id: generateId(),
            reservoirId: saleData.reservoirId,
            type: 'sortie_vente',
            quantite: saleData.quantite,
            date: saleData.date,
            reference: bl.number,
            clientId: saleData.clientId,
            prixUnitaire: saleData.prixUnitaire,
            tauxTVA: saleData.tauxTVA,
            droitTimbre: saleData.droitTimbre,
            createdAt: new Date(),
          }]
        }));
        
        return bl;
      },
      
      updateBLPayment: (blId, payment) => {
        const state = get();
        const bl = state.bonsLivraison.find(b => b.id === blId);
        if (!bl) return false;
        
        set((state) => ({
          bonsLivraison: state.bonsLivraison.map(b => 
            b.id === blId 
              ? { ...b, paymentStatus: 'paye' as const, payment }
              : b
          ),
        }));
        return true;
      },
      // Invoice from BR (Façon - service)
      addInvoiceFromBR: (data) => {
        const state = get();
        const br = state.bonsReception.find(b => b.id === data.brId);
        if (!br || br.status !== 'closed') return null;
        
        // Check if already invoiced
        const existingInvoice = state.invoices.find(i => i.source === 'br' && i.sourceId === data.brId);
        if (existingInvoice) return null;
        
        const trit = state.triturations.find(t => t.brId === data.brId);
        if (!trit) return null;
        
        const client = state.clients.find(c => c.id === br.clientId);
        if (!client) return null;
        
        const montantHT = br.poidsNet * data.prixUnitaire;
        const montantTVA = montantHT * (data.tauxTVA / 100);
        const montantTTC = montantHT + montantTVA + data.droitTimbre;
        
        const invoice: Invoice = {
          id: generateId(),
          number: generateCode('FAC', state.invoices.length),
          date: data.date,
          echeance: data.echeance,
          clientId: br.clientId,
          source: 'br',
          sourceId: data.brId,
          sourceNumber: br.number,
          lignes: [{
            id: generateId(),
            description: `Service trituration - ${br.number} (${br.poidsNet} kg olives)`,
            quantite: br.poidsNet,
            prixUnitaire: data.prixUnitaire,
            montant: montantHT,
          }],
          montantHT,
          tauxTVA: data.tauxTVA,
          montantTVA,
          droitTimbre: data.droitTimbre,
          montantTTC,
          montantPaye: 0,
          resteAPayer: montantTTC,
          status: 'en_attente',
          observations: data.observations,
          createdAt: new Date(),
        };
        
        set((state) => ({
          invoices: [...state.invoices, invoice],
        }));
        
        return invoice;
      },
      
      // Invoice from BL (Vente stock)
      addInvoiceFromBL: (data) => {
        const state = get();
        const bl = state.bonsLivraison.find(b => b.id === data.blId);
        if (!bl || bl.invoiced) return null;
        
        const client = state.clients.find(c => c.id === bl.clientId);
        if (!client) return null;
        
        const invoice: Invoice = {
          id: generateId(),
          number: generateCode('FAC', state.invoices.length),
          date: data.date,
          echeance: data.echeance,
          clientId: bl.clientId,
          source: 'bl',
          sourceId: data.blId,
          sourceNumber: bl.number,
          lignes: [{
            id: generateId(),
            description: `Huile d'olive vierge - ${bl.number}`,
            quantite: bl.quantite,
            prixUnitaire: bl.prixUnitaire,
            montant: bl.montantHT,
          }],
          montantHT: bl.montantHT,
          tauxTVA: bl.tauxTVA,
          montantTVA: bl.montantTVA,
          droitTimbre: bl.droitTimbre,
          montantTTC: bl.montantTTC,
          montantPaye: 0,
          resteAPayer: bl.montantTTC,
          status: 'en_attente',
          observations: data.observations,
          createdAt: new Date(),
        };
        
        set((state) => ({
          invoices: [...state.invoices, invoice],
          bonsLivraison: state.bonsLivraison.map(b => 
            b.id === data.blId ? { ...b, invoiced: true } : b
          ),
        }));
        
        return invoice;
      },
      
      updateInvoice: (id, data) => {
        const state = get();
        const invoice = state.invoices.find(i => i.id === id);
        if (!invoice) return false;
        
        let updatedInvoice = { ...invoice };
        
        if (data.date) updatedInvoice.date = data.date;
        if (data.echeance) updatedInvoice.echeance = data.echeance;
        if (data.observations !== undefined) updatedInvoice.observations = data.observations;
        
        // If TVA or timbre changed, recalculate totals
        if (data.tauxTVA !== undefined || data.droitTimbre !== undefined) {
          const tauxTVA = data.tauxTVA ?? invoice.tauxTVA;
          const droitTimbre = data.droitTimbre ?? invoice.droitTimbre;
          const montantTVA = invoice.montantHT * (tauxTVA / 100);
          const montantTTC = invoice.montantHT + montantTVA + droitTimbre;
          
          updatedInvoice = {
            ...updatedInvoice,
            tauxTVA,
            montantTVA,
            droitTimbre,
            montantTTC,
            resteAPayer: montantTTC - invoice.montantPaye,
          };
        }
        
        set((state) => ({
          invoices: state.invoices.map(i => i.id === id ? updatedInvoice : i),
        }));
        
        return true;
      },
      
      addInvoicePayment: (paymentData) => {
        const state = get();
        const invoice = state.invoices.find(i => i.id === paymentData.invoiceId);
        if (!invoice) return false;
        if (paymentData.montant > invoice.resteAPayer) return false;
        
        const newMontantPaye = invoice.montantPaye + paymentData.montant;
        const newResteAPayer = invoice.montantTTC - newMontantPaye;
        const newStatus = newResteAPayer <= 0 ? 'paye' : 'partiellement_paye';
        
        set((state) => ({
          invoices: state.invoices.map(i => 
            i.id === paymentData.invoiceId 
              ? { ...i, montantPaye: newMontantPaye, resteAPayer: newResteAPayer, status: newStatus }
              : i
          ),
          invoicePayments: [...state.invoicePayments, {
            id: generateId(),
            invoiceId: paymentData.invoiceId,
            montant: paymentData.montant,
            modePayment: paymentData.modePayment,
            date: paymentData.date,
            reference: paymentData.reference,
            observations: paymentData.observations,
            createdAt: new Date(),
          }]
        }));
        
        return true;
      },
      
      // Payment Receipt actions
      addPaymentReceipt: (data) => {
        const state = get();
        const client = state.clients.find(c => c.id === data.clientId);
        if (!client) return null;
        
        const lines: PaymentReceiptLine[] = [];
        
        for (const item of data.items) {
          if (item.type === 'br') {
            const br = state.bonsReception.find(b => b.id === item.id);
            if (!br || br.status !== 'closed' || br.clientId !== data.clientId) continue;
            
            // Check if already paid
            const existingReceipt = state.paymentReceipts.find(pr => 
              pr.lines.some(line => line.brId === item.id)
            );
            if (existingReceipt) continue;
            
            const trituration = state.triturations.find(t => t.brId === item.id);
            if (!trituration || !trituration.prixHuileKg) continue;
            
            const montant = trituration.quantiteHuile * trituration.prixHuileKg;
            
            lines.push({
              sourceType: 'br',
              brId: item.id,
              reference: br.number,
              date: br.date,
              poidsNet: br.poidsNet,
              quantiteHuile: trituration.quantiteHuile,
              prixUnitaire: trituration.prixHuileKg,
              montant,
            });
          } else if (item.type === 'direct') {
            const trituration = state.triturations.find(t => t.id === item.id && t.type === 'direct');
            if (!trituration || trituration.clientId !== data.clientId) continue;
            
            // Check if already paid
            const existingReceipt = state.paymentReceipts.find(pr => 
              pr.lines.some(line => line.triturationId === item.id)
            );
            if (existingReceipt) continue;
            
            if (!trituration.prixHuileKg) continue;
            
            const montant = trituration.quantiteHuile * trituration.prixHuileKg;
            
            lines.push({
              sourceType: 'direct',
              triturationId: item.id,
              reference: `LOT-${trituration.numeroLot || item.id.substring(0, 6)}`,
              date: trituration.date,
              quantiteHuile: trituration.quantiteHuile,
              prixUnitaire: trituration.prixHuileKg,
              montant,
            });
          }
        }
        
        if (lines.length === 0) return null;
        
        const totalMontant = lines.reduce((sum, line) => sum + line.montant, 0);
        
        // Cash flow is always 'sortant' now (mill pays client)
        const cashFlowType = 'sortant';
        
        // Generate receipt number with prefix based on cash flow
        const prefix = 'REC-S';
        const count = state.paymentReceipts.filter(r => r.cashFlowType === cashFlowType).length;
        const number = `${prefix}${String(count + 1).padStart(4, '0')}`;
        
        const receipt: PaymentReceipt = {
          id: generateId(),
          number,
          date: data.date,
          clientId: data.clientId,
          nature: 'bawaz',
          cashFlowType,
          lines,
          totalMontant,
          modePayment: data.modePayment,
          observations: data.observations,
          createdAt: new Date(),
        };
        
        set((state) => ({
          paymentReceipts: [...state.paymentReceipts, receipt],
        }));
        
        return receipt;
      },
      
      // Settings actions
      updateSettings: (settingsData) => set((state) => ({
        settings: { ...state.settings, ...settingsData }
      })),
      
      // Clear all data
      clearAllData: () => set(() => ({
        clients: [],
        clientsGros: [],
        clientOperations: [],
        deletedOperations: [],
        bonsReception: [],
        triturations: [],
        reservoirs: [],
        stockAffectations: [],
        stockMovements: [],
        bonsLivraison: [],
        invoices: [],
        invoicePayments: [],
        paymentReceipts: [],
      })),
    }),
    {
      name: 'olive-mill-storage',
    }
  )
);
