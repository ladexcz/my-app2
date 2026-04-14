import type { BulkOrder, DeliveryTask, Order, Product } from "./types";

export const initialProducts: Product[] = [
  {
    id: "p1",
    name: "Tilapia",
    category: "Fish",
    quantity: 120,
    price: 95,
    harvestDate: "2026-04-12",
    location: "Cavite",
    freshness: "Very fresh",
    shelfLife: "2 days",
    suggestedPrice: 98,
    status: "live",
  },
  {
    id: "p2",
    name: "Red Onion",
    category: "Vegetables",
    quantity: 240,
    price: 52,
    harvestDate: "2026-04-10",
    location: "Laguna",
    freshness: "Fresh",
    shelfLife: "5 days",
    suggestedPrice: 55,
    status: "live",
  },
  {
    id: "p3",
    name: "Sinigang Fish",
    category: "Fish",
    quantity: 80,
    price: 130,
    harvestDate: "2026-04-13",
    location: "Batangas",
    freshness: "Just caught",
    shelfLife: "1 day",
    suggestedPrice: 133,
    status: "live",
  },
];

export const initialBulkOrders: BulkOrder[] = [
  {
    id: "b1",
    item: "Red Onion",
    targetKg: 100,
    joinedKg: 42,
    tiers: [
      { threshold: 50, price: 60 },
      { threshold: 100, price: 55 },
      { threshold: 300, price: 48 },
    ],
    currentPrice: 60,
    status: "open",
    buyers: ["Tienda Market"],
  },
  {
    id: "b2",
    item: "Eggplant",
    targetKg: 80,
    joinedKg: 24,
    tiers: [
      { threshold: 50, price: 65 },
      { threshold: 80, price: 60 },
      { threshold: 200, price: 55 },
    ],
    currentPrice: 65,
    status: "open",
    buyers: ["Kinse KaKom"],
  },
];

export const initialOrders: Order[] = [
  {
    id: "o1",
    productId: "p1",
    buyerName: "Maia Store",
    quantity: 20,
    total: 1900,
    status: "pending",
    pickupOrDelivery: "Delivery",
    assignedRider: "Jun",
    eta: "45 mins",
  },
];

export const initialTasks: DeliveryTask[] = [
  {
    id: "d1",
    route: "Cavite → Manila",
    stops: 3,
    loadKg: 95,
    status: "assigned",
    riderName: "Ella",
    earnings: 320,
  },
  {
    id: "d2",
    route: "Laguna → Quezon City",
    stops: 2,
    loadKg: 68,
    status: "assigned",
    riderName: "Mika",
    earnings: 240,
  },
];
