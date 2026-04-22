// lib/websocket-client.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Initialize WebSocket connection
 */
export function initializeWebSocket(token: string): Socket {
  if (socket) {
    return socket;
  }

  const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  socket = io(serverUrl, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  return socket;
}

/**
 * Get WebSocket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Subscribe to marketplace updates (all products)
 */
export function subscribeToMarketplace(callback: (data: any) => void): void {
  if (!socket) return;
  socket.on('product.updated', callback);
  socket.on('product.created', callback);
}

/**
 * Subscribe to producer orders channel (private)
 */
export function subscribeToProducerOrders(producerId: number, callback: (data: any) => void): void {
  if (!socket) return;
  socket.emit('subscribe', `producer-orders.${producerId}`);
  socket.on(`producer-orders.${producerId}:order.created`, callback);
}

/**
 * Subscribe to rider deliveries channel (private)
 */
export function subscribeToRiderDeliveries(riderId: number, callback: (data: any) => void): void {
  if (!socket) return;
  socket.emit('subscribe', `rider-deliveries.${riderId}`);
  socket.on(`rider-deliveries.${riderId}:delivery.assigned`, callback);
}

/**
 * Subscribe to order tracking channel (private)
 */
export function subscribeToOrderTracking(orderId: number, callback: (data: any) => void): void {
  if (!socket) return;
  socket.emit('subscribe', `order-tracking.${orderId}`);
  socket.on(`order-tracking.${orderId}:order.status-changed`, callback);
  socket.on(`order-tracking.${orderId}:delivery.location-updated`, callback);
}

/**
 * Subscribe to admin dashboard
 */
export function subscribeToAdminDashboard(callback: (data: any) => void): void {
  if (!socket) return;
  socket.emit('subscribe', 'admin-dashboard');
  socket.on('admin-dashboard:order.created', callback);
  socket.on('admin-dashboard:delivery.assigned', callback);
  socket.on('admin-dashboard:order.status-changed', callback);
}

/**
 * Unsubscribe from channel
 */
export function unsubscribe(channel: string): void {
  if (!socket) return;
  socket.emit('unsubscribe', channel);
  socket.off(`${channel}:*`);
}

/**
 * Disconnect WebSocket
 */
export function disconnectWebSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Emit custom event
 */
export function emitEvent(event: string, data?: any): void {
  if (!socket) return;
  socket.emit(event, data);
}

/**
 * Listen to custom events
 */
export function onEvent(event: string, callback: (data: any) => void): void {
  if (!socket) return;
  socket.on(event, callback);
}
