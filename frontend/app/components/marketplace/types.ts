export type FlowTab = "producer" | "buyer" | "rider";

export type Product = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  harvestDate: string;
  location: string;
  freshness: string;
  shelfLife: string;
  suggestedPrice: number;
  status: "live" | "reserved" | "ready" | "sold";
};

export type BulkOrder = {
  id: string;
  item: string;
  targetKg: number;
  joinedKg: number;
  tiers: { threshold: number; price: number }[];
  currentPrice: number;
  status: "open" | "filled";
  buyers: string[];
};

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  productId: string;
  buyerName: string;
  quantity: number;
  total: number;
  status: "pending" | "accepted" | "preparing" | "in transit" | "delivered";
  pickupOrDelivery: "Pickup" | "Delivery";
  assignedRider: string;
  eta: string;
};

export type DeliveryTask = {
  id: string;
  route: string;
  stops: number;
  loadKg: number;
  status: "assigned" | "pickup" | "delivering" | "completed";
  riderName: string;
  earnings: number;
};

export type ProducerForm = {
  name: string;
  category: string;
  quantity: number;
  price: number;
  harvestDate: string;
  location: string;
};
