import { db } from '../config/db.js';
import type { Order } from '../modules/orders/orders.types.js';

export const users = db.collection('user');
export const menuItems = db.collection('menuItems');
export const orders = db.collection<Order>('orders');
export const transactions = db.collection('transactions');
