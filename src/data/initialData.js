const SEED_DESIGNS_VOL1 = [
  {
    id: 'd-1',
    designCode: '6211',
    colorCode: 'J1',
    status: 'initiated',
    units: 1500,
    plannedUnits: 1500,
    actualUnits: null,
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
    status: 'initiated',
    units: 800,
    plannedUnits: 800,
    actualUnits: null,
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
    status: 'completed',
    units: 500,
    plannedUnits: 500,
    actualUnits: 472,
    items: [
      { id: 'item-6', name: 'Kamiz', clothType: 'Premium Lawn', metersPerUnit: 2.5 },
      { id: 'item-7', name: 'Dupatta', clothType: 'Chiffon', metersPerUnit: 2.0 },
    ],
    createdAt: '2026-05-05',
    dyeingCompletedAt: '2026-05-12',
  },
]

const SEED_DESIGNS_VOL2 = [
  {
    id: 'd-4',
    designCode: '7240',
    colorCode: 'R1',
    status: 'initiated',
    units: 600,
    plannedUnits: 600,
    actualUnits: null,
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
    status: 'initiated',
    units: 400,
    plannedUnits: 400,
    actualUnits: null,
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

export const INITIAL_DYEING_JOBS = [
  {
    id: 'dye-job-1',
    batchSerial: 'DYE-20260505-A1B2',
    volumeId: 'vol-1',
    volumeName: 'Volume 1 (Luxury Lawn)',
    status: 'completed',
    sentAt: '2026-05-05',
    completedAt: '2026-05-12',
    designs: [
      {
        designId: 'd-3',
        designCode: '6213',
        colorCode: 'J3',
        plannedUnits: 500,
        clothTotals: { 'Premium Lawn': 1250, Chiffon: 1000 },
      },
    ],
    plannedClothTotals: { 'Premium Lawn': 1250, Chiffon: 1000 },
    lots: [
      {
        id: 'lot-1',
        lotNumber: 'LOT-PL-6213-A',
        clothType: 'Premium Lawn',
        receivedMeters: 1180,
        receivedAt: '2026-05-10',
        assignments: [{ designId: 'd-3', assignedMeters: 1180 }],
      },
      {
        id: 'lot-2',
        lotNumber: 'LOT-CH-6213-B',
        clothType: 'Chiffon',
        receivedMeters: 944,
        receivedAt: '2026-05-11',
        assignments: [{ designId: 'd-3', assignedMeters: 944 }],
      },
    ],
    wastageSummary: {
      byCloth: {
        'Premium Lawn': {
          plannedMeters: 1250,
          receivedMeters: 1180,
          lostMeters: 70,
          lossPercent: 5.6,
        },
        Chiffon: {
          plannedMeters: 1000,
          receivedMeters: 944,
          lostMeters: 56,
          lossPercent: 5.6,
        },
      },
      totalLostMeters: 126,
    },
    designOutcomes: [
      {
        designId: 'd-3',
        designCode: '6213',
        colorCode: 'J3',
        plannedUnits: 500,
        actualUnits: 472,
        varianceUnits: -28,
        variancePercent: -5.6,
        wastageByCloth: {
          'Premium Lawn': {
            plannedMeters: 1250,
            receivedMeters: 1180,
            lostMeters: 70,
            lossPercent: 5.6,
          },
          Chiffon: {
            plannedMeters: 1000,
            receivedMeters: 944,
            lostMeters: 56,
            lossPercent: 5.6,
          },
        },
        assignedCloth: { 'Premium Lawn': 1180, Chiffon: 944 },
      },
    ],
  },
]

export const INITIAL_VOLUMES = INITIAL_FINISHED_GOODS_STOCK
export const INITIAL_SUPPLIES = INITIAL_PURCHASES
