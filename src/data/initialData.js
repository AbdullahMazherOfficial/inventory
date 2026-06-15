const SEED_DESIGNS_VOL1 = [
  {
    id: 'd-1',
    designCode: '6211',
    colorCode: 'J1',
    processStatus: 'embroidery',
    units: 1500,
    items: [
      { id: 'item-1', name: 'Kamiz', clothType: 'Premium Lawn', metersPerUnit: 2.5 },
      { id: 'item-2', name: 'Shalwar', clothType: 'Premium Lawn', metersPerUnit: 3 },
      { id: 'item-3', name: 'Dupatta', clothType: 'Chiffon', metersPerUnit: 2.2 },
    ],
    createdAt: '2026-05-01',
  },
  {
    id: 'd-2',
    designCode: '6212',
    colorCode: 'J2',
    processStatus: 'painting',
    units: 800,
    items: [
      { id: 'item-4', name: 'Kamiz', clothType: 'Premium Lawn', metersPerUnit: 2.5 },
      { id: 'item-5', name: 'Shalwar', clothType: 'Premium Lawn', metersPerUnit: 1.8 },
    ],
    createdAt: '2026-05-03',
  },
  {
    id: 'd-3',
    designCode: '6213',
    colorCode: 'J3',
    processStatus: 'dyeing',
    units: 500,
    items: [
      { id: 'item-6', name: 'Kamiz', clothType: 'Premium Lawn', metersPerUnit: 2.5 },
      { id: 'item-7', name: 'Dupatta', clothType: 'Chiffon', metersPerUnit: 2.0 },
    ],
    createdAt: '2026-05-05',
  },
]

const SEED_DESIGNS_VOL2 = [
  {
    id: 'd-4',
    designCode: '7240',
    colorCode: 'R1',
    processStatus: 'pending',
    units: 600,
    items: [
      { id: 'item-8', name: 'Kamiz', clothType: 'Chiffon', metersPerUnit: 3.0 },
      { id: 'item-9', name: 'Shalwar', clothType: 'Chiffon', metersPerUnit: 2.0 },
    ],
    createdAt: '2026-05-08',
  },
  {
    id: 'd-5',
    designCode: '7241',
    colorCode: 'R2',
    processStatus: 'embroidery',
    units: 400,
    items: [
      { id: 'item-10', name: 'Kamiz', clothType: 'Chiffon', metersPerUnit: 3.0 },
      { id: 'item-11', name: 'Shalwar', clothType: 'Chiffon', metersPerUnit: 2.0 },
      { id: 'item-12', name: 'Dupatta', clothType: 'Laces', metersPerUnit: 1.5 },
    ],
    createdAt: '2026-05-10',
  },
]

export const INITIAL_FINISHED_GOODS_STOCK = [
  {
    id: 'vol-1',
    name: 'Volume 1 (Luxury Lawn)',
    designs: SEED_DESIGNS_VOL1,
  },
  {
    id: 'vol-2',
    name: 'Volume 2 (Chiffon Edit)',
    designs: SEED_DESIGNS_VOL2,
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

export const INITIAL_VOLUMES = INITIAL_FINISHED_GOODS_STOCK
export const INITIAL_SUPPLIES = INITIAL_PURCHASES
