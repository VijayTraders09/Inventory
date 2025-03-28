import { LayoutDashboardIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full h-[100vh] flex justify-center items-start">
      <div className="b">
        <h1 className="text-center text-3xl font-semibold mt-4">VJ Traders</h1>
        <div className="p-4 flex justify-center w-full">
          <div className=" w-[200px] flex justify-center items-center gap-2 p-4 rounded-md bg-secondaryGrey">
            <LayoutDashboardIcon />
            <Link href={"/dashboard"}>
              <h3 className=" font-bold text-xl">Dashboard</h3>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-2">
          <Link href={"/add-sale"}>
            <div className="flex justify-center items-center h-[150px] w-[200px] cursor-pointer rounded-md bg-lightOrange">
              <h3 className=" font-bold text-xl">Sale</h3>
            </div>
          </Link>
          <Link href={"/add-purchase"}>
          <div className="flex justify-center items-center h-[150px] w-[200px] cursor-pointer rounded-md bg-lightGreen">
            <h3 className=" font-bold text-xl">Purchase</h3>
          </div>
          </Link>
          <div className="flex justify-center items-center h-[150px] w-[200px] cursor-pointer rounded-md bg-lightSkyblue">
            <h3 className=" font-bold text-xl">Transfer</h3>
          </div>
          <Link href={"/add-return-sale"}>
          <div className="flex justify-center items-center h-[150px] w-[200px] cursor-pointer rounded-md bg-lightOrange">
            <h3 className=" font-bold text-xl">Sale Return</h3>
          </div>
          </Link>
          <Link href={"/add-return-purchase"}>
          <div className="flex justify-center items-center h-[150px] w-[200px] cursor-pointer rounded-md bg-lightGreen">
            <h3 className=" font-bold text-xl">Purchase Return</h3>
          </div>
          </Link>
          <Link href={"/goddown"}>
            <div className="flex justify-center items-center h-[150px] w-[200px] cursor-pointer rounded-md bg-lightSkyblue">
              <h3 className=" font-bold text-xl">Goddown</h3>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
