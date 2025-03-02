"use client";

import React from "react";
import { Input } from "./ui/input";
import { Bell, Search, UserCircle } from "lucide-react";

const Header = ({ SidebarTrigger, ModeToggle }) => {
  return (
    <div className="w-full h-[50px] bg-white shadow-2xl flex justify-between items-center m-0">
      <div className="h-[50px] flex justify-between items-center gap-2 px-2">
        <SidebarTrigger />
        <div className="w-[400px] flex gap01 items-center text-md">
          <Search className="text-primaryGrey" size={20} />
          <Input
            type="text"
            placeholder="Search"
            className="border-0 focus-visible:ring-0"
          />
        </div>
      </div>
      <div className="h-[50px] flex justify-between items-center gap-4 px-2">
        <Bell className="text-primaryGrey" size={20}/>
        <UserCircle className="text-primaryGrey" size={30}/>
        <ModeToggle />
      </div>
    </div>
  );
};

export default Header;
