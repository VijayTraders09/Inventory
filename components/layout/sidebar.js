'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, 
  Package, 
  Users, 
  Building, 
  ShoppingCart, 
  ArrowUpCircle, 
  DollarSign, 
  ArrowLeftCircle, 
  Truck, 
  ArrowRightLeft  } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
   { name: 'Home', href: '/', icon: Home },
  { name: 'Inventory', href: '/inventory/category', icon: Package },
  { name: 'Customers', href: '/customer', icon: Users },
  { name: 'Godown', href: '/godown', icon: Building },
  { name: 'Purchase', href: '/purchase', icon: ShoppingCart },
  { name: 'Purchase Return', href: '/purchase-return', icon: ArrowUpCircle },
  { name: 'Sell', href: '/sell', icon: DollarSign },
  { name: 'Sell Return', href: '/sell-return', icon: ArrowLeftCircle },
  { name: 'Stock Transfer', href: '/stock-transfer', icon: Truck },
  { name: 'Product Exchange', href: '/product-exchange', icon: ArrowRightLeft },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">Vijay Traders</h1>
      </div>
      <nav className="px-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-3 mb-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}