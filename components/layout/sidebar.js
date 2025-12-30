'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Inventory', href: '/inventory/category', icon: Package },
  { name: 'Customers', href: '/customer', icon: Package },
  { name: 'Godown', href: '/godown', icon: Users },
  { name: 'Purchase', href: '/purchase', icon: Users },
  { name: 'Sell', href: '/sell', icon: Users },
  { name: 'Stock Transfer', href: '/stock-transfer', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
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