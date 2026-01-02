import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client, BonReception, Trituration, Reservoir, Payment, Settings, StockAffectation, StockMovement, BonLivraison } from '@/types';

interface AppState {
  clients: Client[];
  bonsReception: BonReception[];
  triturations: Trituration[];
  reservoirs: Reservoir[];
  payments: Payment[];
  stockAffectations: StockAffectation[];
  stockMovements: StockMovement[];
  bonsLivraison: BonLivraison[];
  settings: Settings;
  
  // Client actions
  addClient: (client: Omit<Client, 'id' | 'code' | 'createdAt'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  // BR actions
  addBR: (br: Omit<BonReception, 'id' | 'number' | 'poidsNet' | 'status' | 'createdAt'>) => void;
  updateBR: (id: string, br: Partial<BonReception>) => void;
  closeBR: (id: string) => void;
  
  // Trituration actions
  addTrituration: (trituration: Omit<Trituration, 'id' | 'createdAt'>) => void;
  
  // Reservoir actions
  addReservoir: (reservoir: Omit<Reservoir, 'id' | 'createdAt'>) => void;
  updateReservoir: (id: string, reservoir: Partial<Reservoir>) => void;
  affectToReservoir: (reservoirId: string, quantity: number, brId: string) => boolean;
  transferBetweenReservoirs: (fromId: string, toId: string, quantity: number) => boolean;
  
  // Sales actions
  addSale: (sale: { clientId: string; reservoirId: string; quantite: number; prixUnitaire: number; tauxTVA: number; droitTimbre: number; date: Date }) => BonLivraison | null;
  
  // Payment actions
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => void;
  
  // Settings actions
  updateSettings: (settings: Partial<Settings>) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateCode = (prefix: string, count: number) => `${prefix}${String(count + 1).padStart(4, '0')}`;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: [],
      bonsReception: [],
      triturations: [],
      reservoirs: [],
      payments: [],
      stockAffectations: [],
      stockMovements: [],
      bonsLivraison: [],
      settings: {
        companyName: 'Huilerie Moderne',
        defaultPrixFacon: 0.5,
        defaultPrixBase: 15,
        partHuilerieBawaza: 20,
      },
      
      // Client actions
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
      
      // BR actions
      addBR: (brData) => set((state) => ({
        bonsReception: [...state.bonsReception, {
          ...brData,
          id: generateId(),
          number: generateCode('BR', state.bonsReception.length),
          poidsNet: brData.poidsPlein - brData.poidsVide,
          status: 'open',
          createdAt: new Date(),
        }]
      })),
      
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
        get().closeBR(tritData.brId);
      },
      
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
      
      affectToReservoir: (reservoirId, quantity, brId) => {
        const state = get();
        const reservoir = state.reservoirs.find(r => r.id === reservoirId);
        if (!reservoir) return false;
        
        const newQuantity = reservoir.quantiteActuelle + quantity;
        if (newQuantity > reservoir.capaciteMax) return false;
        
        const br = state.bonsReception.find(b => b.id === brId);
        
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
            brId,
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
            reference: br?.number,
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
      
      // Payment actions
      addPayment: (paymentData) => set((state) => ({
        payments: [...state.payments, {
          ...paymentData,
          id: generateId(),
          createdAt: new Date(),
        }]
      })),
      
      // Settings actions
      updateSettings: (settingsData) => set((state) => ({
        settings: { ...state.settings, ...settingsData }
      })),
    }),
    {
      name: 'olive-mill-storage',
    }
  )
);
