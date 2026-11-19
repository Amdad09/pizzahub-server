import type { ObjectId } from 'mongodb';

export const MENU_STATUSES = [
    'pending',
    'approved',
    'rejected',
    'inactive',
] as const;

export type MenuStatus = (typeof MENU_STATUSES)[number];

export interface MenuItem {
    _id: ObjectId;
    vendorId: string;
    vendorName: string;
    name: string;
    description: string;
    price: number;
    category: string;
    location: string;
    images: string[];
    status: MenuStatus;
    isActive: boolean;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface MenuFilters {
    q?: string;
    category?: string;
    location?: string;
    sort?: 'price_asc' | 'price_desc';
    page: number;
    limit: number;
}
