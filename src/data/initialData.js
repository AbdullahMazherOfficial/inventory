export const INITIAL_VOLUMES = [
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

export const INITIAL_SUPPLIES = [
  {
    id: 'sup-1',
    name: 'Cotton Fabric',
    vendor: 'Al-Fatah Textiles',
    type: 'Fabric',
    volumeId: 'vol-1',
    quantity: 2000,
    unit: 'meters',
    unitPrice: 2.5,
  },
  {
    id: 'sup-2',
    name: 'Embroidered Borders',
    vendor: 'Heritage Embroidery Co.',
    type: 'Embroidery',
    volumeId: 'vol-1',
    quantity: 1200,
    unit: 'yards',
    unitPrice: 2,
  },
  {
    id: 'sup-3',
    name: 'Chiffon Dupattas',
    vendor: 'Silk Route Suppliers',
    type: 'Dupatta',
    volumeId: 'vol-2',
    quantity: 800,
    unit: 'pieces',
    unitPrice: 4.5,
  },
  {
    id: 'sup-4',
    name: 'Laces',
    vendor: 'Royal Trim House',
    type: 'Trim',
    volumeId: 'vol-2',
    quantity: 500,
    unit: 'yards',
    unitPrice: 3.2,
  },
]

export const INITIAL_SALES = [
  { id: 'sale-1', orderId: 'RS-2024-0847', customer: 'Boutique Elegance', design: 'J1 — Crimson Red', volume: 'Volume 1 (Luxury Lawn)', quantity: 48, amount: 14400, status: 'completed', date: '2024-05-28' },
  { id: 'sale-2', orderId: 'RS-2024-0851', customer: 'Threads & Co.', design: 'J2 — Emerald Green', volume: 'Volume 1 (Luxury Lawn)', quantity: 36, amount: 10800, status: 'completed', date: '2024-05-30' },
  { id: 'sale-3', orderId: 'RS-2024-0856', customer: 'Lahore Fashion House', design: 'R2 — Midnight Black', volume: 'Volume 2 (Chiffon Edit)', quantity: 60, amount: 21000, status: 'pending', date: '2024-06-02' },
  { id: 'sale-4', orderId: 'RS-2024-0860', customer: 'Karachi Couture', design: 'J3 — Royal Ivory', volume: 'Volume 1 (Luxury Lawn)', quantity: 24, amount: 9600, status: 'processing', date: '2024-06-04' },
  { id: 'sale-5', orderId: 'RS-2024-0863', customer: 'Islamabad Styles', design: 'R1 — Pastel Pink', volume: 'Volume 2 (Chiffon Edit)', quantity: 30, amount: 10500, status: 'completed', date: '2024-06-05' },
]
