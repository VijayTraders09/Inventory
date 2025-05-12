"use client";
import { AddBuyer } from "@/components/buyer/AddBuyer";
import Buyertable from "@/components/buyer/Buyertable";
import ItemsTable from "@/components/items-table/ItemsTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { useState } from "react";
import SalesTable from "../sells/SalesTable";
import { ToastContainer } from "react-toastify";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

const page = () => {
  const [selectedBuyer, setSelectedBuyer] = useState({});
  const [open, setOpen] = useState(false);
  const [openSalestable, setOpenSalesTable] = useState(false);
  const [fetchData, setFetchData] = useState(true);

  return (
    <div className=" w-full p-4">
              <ToastContainer position="top-right" autoClose={3000} />

      <AddBuyer
        selectedBuyer={selectedBuyer}
        setSelectedBuyer={setSelectedBuyer}
        open={open}
        setOpen={setOpen}
        fetchData={fetchData}
        setFetchData={setFetchData}
      />
      <Buyertable
        selectedBuyer={selectedBuyer}
        setSelectedBuyer={setSelectedBuyer}
        open={open}
        setOpen={setOpen}
        fetchData={fetchData}
        setOpenSalesTable={setOpenSalesTable}
        setFetchData={setFetchData}
      />
      <Dialog open={openSalestable} onOpenChange={setOpenSalesTable}>
        <DialogContent className="sm:max-w-[1200px]">
          <DialogHeader>
            <DialogTitle>{selectedBuyer?.buyerName}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <SalesTable selectedBuyer={selectedBuyer}/>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default page;
