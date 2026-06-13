import { buildRawStockFromPurchases } from '../utils/inventoryHelpers'

export const INITIAL_FINISHED_GOODS_STOCK = [
  {
    id: 'vol-1',
    name: 'Volume 1 (Luxury Lawn)',
    designs: [
      { id: 'd-1', code: 'J1', color: 'Crimson Red', fabric: 'Premium Lawn', units: 450 },
      { id: 'd-2', code: 'J2', color: 'Emerald Green', fabric: 'Premium Lawn', units: 300 },
      { id: 'd-3', code: 'J3', color: 'Royal Ivory', fabric: 'Premium Lawn', units: 150 },
    ],
  },
  {
    id: 'vol-2',
    name: 'Volume 2 (Chiffon Edit)',
    designs: [
      { id: 'd-4', code: 'R1', color: 'Pastel Pink', fabric: 'Chiffon', units: 200 },
      { id: 'd-5', code: 'R2', color: 'Midnight Black', fabric: 'Chiffon', units: 500 },
    ],
  },
]

export const INITIAL_PURCHASES = [
  {
    id: 'pur-1',
    materialType: 'Premium Lawn',
    vendor: 'Al-Fatah Textiles',
    quantity: 2000,
    unit: 'meters',
    unitPrice: 250,
    totalPrice: 500000,
    date: '2026-05-15',
    batchSerial: 'RS-BATCH-20260515-A1B2',
    status: 'complete',
  },
  {
    id: 'pur-2',
    materialType: 'Embroidered Borders',
    vendor: 'Heritage Embroidery Co.',
    quantity: 1200,
    unit: 'meters',
    unitPrice: 200,
    totalPrice: 240000,
    date: '2026-05-18',
    batchSerial: 'RS-BATCH-20260518-C3D4',
    status: 'complete',
  },
  {
    id: 'pur-3',
    materialType: 'Chiffon',
    vendor: 'Silk Route Suppliers',
    quantity: 800,
    unit: 'meters',
    unitPrice: 450,
    totalPrice: 360000,
    date: '2026-05-20',
    batchSerial: 'RS-BATCH-20260520-E5F6',
    status: 'complete',
  },
  {
    id: 'pur-4',
    materialType: 'Laces',
    vendor: 'Royal Trim House',
    quantity: 500,
    unit: 'meters',
    unitPrice: 320,
    totalPrice: 160000,
    date: '2026-05-22',
    batchSerial: 'RS-BATCH-20260522-G7H8',
    status: 'complete',
  },
  {
    id: 'pur-5',
    materialType: 'Silk',
    vendor: 'Lahore Silk Mills',
    quantity: 600,
    unit: 'meters',
    unitPrice: 800,
    totalPrice: 480000,
    date: '2026-06-10',
    batchSerial: 'RS-BATCH-20260610-I9J0',
    status: 'in_progress',
  },
]

export const INITIAL_PRODUCTION = []

export const INITIAL_RAW_MATERIAL_STOCK = buildRawStockFromPurchases(INITIAL_PURCHASES)

export const INITIAL_VOLUMES = INITIAL_FINISHED_GOODS_STOCK
export const INITIAL_SUPPLIES = INITIAL_PURCHASES
