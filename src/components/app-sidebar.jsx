"use client";

import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  Boxes,
  ChartColumnIncreasing,
  User,
  BaggageClaim,
  Store,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";

// Menu items.
const items1 = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
  },
  {
    title: "Inventory",
    url: "/dashboard/inventory",
    icon: BaggageClaim,
  },
  {
    title: "Customer Report",
    url: "#",
    icon: ChartColumnIncreasing,
  },
  {
    title: "Suppliers",
    url: "#",
    icon: User,
  },
  {
    title: "Sells",
    url: "/dashboard/sells",
    icon: Boxes,
  },
  {
    title: "Purchase",
    url: "/dashboard/purchases",
    icon: Boxes,
  },
  {
    title: "Return Purchase",
    url: "/dashboard/return-purchases",
    icon: Boxes,
  },
  {
    title: "Sale Purchase",
    url: "/dashboard/return-sale",
    icon: Boxes,
  },
  {
    title: "Manage Store",
    url: "#",
    icon: Store,
  },
];

const items2 = [
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
  {
    title: "Log Out",
    url: "#",
    icon: LogOut,
  },
];

export function AppSidebar({ logo }) {
  const pathname = usePathname();
  console.log(pathname)
  return (
    <SidebarInset className="shadow-2xl w-[250px] border-2 border-red-600 m-0">
      <Sidebar>
        <SidebarContent className="px-4">
          <SidebarGroup className=" h-full">
            <SidebarGroupLabel className="h-[50px]">
              <div className="flex justify-start items-center gap-2">
                <Image src={logo} alt="Banner" width={40} height={40} />
                <h1 className="text-xl text-primaryBlue">Vijay Traders</h1>
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-6 flex flex-col h-full justify-between">
              <SidebarMenu>
                {items1.map((item) => (
                  <SidebarMenuItem key={item.title} className="my-2">
                    <SidebarMenuButton
                      asChild
                      className={`hover:text-primaryBlue hover:dark:text-primaryBlue ${pathname.includes(item.url)?'bg-primaryBlue text-white':'bg-white'}`}
                    >
                      <a
                        href={item.url}
                        className="text-lg text-primaryGrey dark:text-white"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              <SidebarMenu>
                {items2.map((item) => (
                  <SidebarMenuItem key={item.title} className="my-2">
                    <SidebarMenuButton
                      asChild
                      className={`hover:text-primaryBlue hover:dark:text-primaryBlue`}
                    >
                      <Link
                        href={pathname + item.url}
                        className="text-lg text-primaryGrey dark:text-white"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarInset>
  );
}
