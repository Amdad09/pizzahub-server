import { users, menuItems, orders, transactions } from './collections.js';

export async function createDatabaseIndexes(): Promise<void> {
    await Promise.all([
        users.createIndex(
            { role: 1, isBlocked: 1 },
            { name: 'role_blocked_idx' },
        ),

        menuItems.createIndex(
            { vendorId: 1, createdAt: -1 },
            { name: 'vendor_created_idx' },
        ),

        menuItems.createIndex(
            { status: 1, isActive: 1, createdAt: -1 },
            { name: 'status_active_created_idx' },
        ),

        menuItems.createIndex(
            { category: 1, status: 1, isActive: 1 },
            { name: 'category_status_active_idx' },
        ),

        menuItems.createIndex(
            { location: 1, status: 1, isActive: 1 },
            { name: 'location_status_active_idx' },
        ),

        orders.createIndex(
            { customerId: 1, createdAt: -1 },
            { name: 'customer_created_idx' },
        ),

        orders.createIndex(
            { vendorId: 1, status: 1, createdAt: -1 },
            { name: 'vendor_status_created_idx' },
        ),

        transactions.createIndex(
            { stripeSessionId: 1 },
            {
                name: 'stripe_session_unique_idx',
                unique: true,
                sparse: true,
            },
        ),
        orders.createIndex(
            { customerId: 1, menuItemId: 1, deliveryDate: 1 },
            {
                name: 'active_customer_item_date_unique_idx',
                unique: true,
                partialFilterExpression: {
                    status: { $in: ['pending', 'accepted'] },
                },
            },
        ),
        orders.createIndex(
            { customerId: 1, createdAt: -1 },
            { name: 'customer_created_idx' },
        ),

        orders.createIndex(
            { vendorId: 1, status: 1, createdAt: -1 },
            { name: 'vendor_status_created_idx' },
        ),
    ]);
}
