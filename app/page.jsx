"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShoppingCart,
  Package,
  Building,
  Users,
  ArrowRightLeft,
  FileText,
  BarChart3,
} from "lucide-react";

export default function HomePage() {
  const modules = [
    {
      title: "Sell",
      icon: <ShoppingCart className="h-8 w-8" />,
      color: "bg-pink-500",
      href: "/sell-form",
    },
    {
      title: "Purchase",
      icon: <Package className="h-8 w-8" />,
      color: "bg-green-500",
      href: "/purchase-form",
    },
    {
      title: "Transfer",
      icon: <ArrowRightLeft className="h-8 w-8" />,
      color: "bg-blue-500",
      href: "/transfer-stock-form",
    },
    {
      title: "Sell Return",
      icon: <ShoppingCart className="h-8 w-8" />,
      color: "bg-purple-500",
      href: "/sell-return-form",
    },
    {
      title: "Purchase Return",
      icon: <Package className="h-8 w-8" />,
      color: "bg-orange-500",
      href: "/purchase-return-form",
    },
    {
      title: "Godown",
      icon: <Building className="h-8 w-8" />,
      color: "bg-cyan-500",
      href: "/godown",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">VJ Traders</h1>
          <p className="text-lg text-gray-600">Inventory Management System</p>
        </div>
        <div className="flex justify-center mb-8">
          <Link href="/inventory/category">
            <Button className=" cursor-pointer bg-gray-800 hover:bg-gray-900 text-white px-12 py-5 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Link key={module.title} href={module.href}>
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 bg-white">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center space-y-4">
                    <div
                      className={`${module.color} text-white p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow`}
                    >
                      {module.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {module.title}
                    </h2>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
