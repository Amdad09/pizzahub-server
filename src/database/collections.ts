import { db } from '../config/db.js';

export const users = db.collection('user');
export const menuItems = db.collection('menuItems');
export const orders = db.collection('orders');
export const transactions = db.collection('transactions');
