export const INITIAL_FINISHED_GOODS_STOCK = []

export const INITIAL_PURCHASES = [
  {
    id: 'pur-cotton',
    materialType: 'Cotton',
    vendor: 'Al-Fatah Textiles',
    quantity: 15000,
    unit: 'meters',
    unitPrice: 250,
    totalPrice: 3750000,
    date: '2026-05-15',
    batchSerial: 'RS-BATCH-20260515-COT1',
    status: 'complete',
  },
  {
    id: 'pur-linen',
    materialType: 'Raw Linen',
    vendor: 'Heritage Fabrics',
    quantity: 5000,
    unit: 'meters',
    unitPrice: 320,
    totalPrice: 1600000,
    date: '2026-05-18',
    batchSerial: 'RS-BATCH-20260518-LIN1',
    status: 'complete',
  },
  {
    id: 'pur-chiffon',
    materialType: 'Chiffon',
    vendor: 'Silk Route Suppliers',
    quantity: 3000,
    unit: 'meters',
    unitPrice: 450,
    totalPrice: 1350000,
    date: '2026-05-20',
    batchSerial: 'RS-BATCH-20260520-CHF1',
    status: 'complete',
  },
  {
    id: 'pur-silk',
    materialType: 'Silk',
    vendor: 'Lahore Silk Mills',
    quantity: 600,
    unit: 'meters',
    unitPrice: 800,
    totalPrice: 480000,
    date: '2026-06-10',
    batchSerial: 'RS-BATCH-20260610-SLK1',
    status: 'in_progress',
  },
]

export const INITIAL_PRODUCTION = []
export const INITIAL_DYEING_JOBS = []
export const INITIAL_PRODUCTION_VOLUMES = []

export const INITIAL_VOLUMES = INITIAL_FINISHED_GOODS_STOCK
export const INITIAL_SUPPLIES = INITIAL_PURCHASES
