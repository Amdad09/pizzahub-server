import { db } from '../config/db.js';

import type { Order } from '../modules/orders/orders.types.js';
import type {
    StripeEventRecord,
    Subscription,
    SubscriptionTransaction,
} from '../modules/subscriptions/subscriptions.types.js';

export const users = db.collection('user');
export const menuItems = db.collection('menuItems');
export const orders = db.collection<Order>('orders');
export const transactions =
    db.collection<SubscriptionTransaction>('transactions');
export const subscriptions = db.collection<Subscription>('subscriptions');
export const stripeEvents = db.collection<StripeEventRecord>('stripeEvents');
