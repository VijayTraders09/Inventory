"use client";

import { Button } from "@/components/ui/button";
import { db } from "@/firebase/config";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import ItemsTable from "@/components/items-table/ItemsTable";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function Orders() {
  const [sale, setSale] = useState([]);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const fetchSale = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "sales"));
      const sales = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSale(sales);
    } catch (error) {
      console.error("Error fetching sale: ", error);
      setSale([]);
    }
  };

  useEffect(() => {
    fetchSale();
  }, []);

  const CustomCell = ({ value }) => (
    <p className="text-black dark:white">{value}</p>
  );

  const SeeItems = ({data}) => {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button
            variant="outline"
            className="bg-buttonBg text-white"
            onClick={()=>setItems(data.items)}
            // onClick={setOpen(true)}
          >
            See Items
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Items</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <ItemsTable list={items} setList={setItems} hideRemove={true}/>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const columnDefs = [
    {
      headerName: "id",
      field: "id",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex: 1,
    },
    {
      headerName: "Customer Name",
      field: "customer",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex: 1,
    },
    {
      headerName: "Goddown",
      field: "goddown",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex: 1,
    },
    {
      headerName: "Mode of transport",
      field: "transport",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex: 1,
    },
    {
      headerName: "Invoice",
      field: "invoice",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex: 1,
    },
    {
      headerName: "Items",
      field: "items",
      sortable: true,
      filter: true,
      cellRenderer: SeeItems,
      flex: 1,
    },
  ];

  console.log(sale);
  return (
    <div className={`dark:text-red text-blue p-4 rounded-lg w-full h-96 `}>
      <AgGridReact columnDefs={columnDefs} rowData={sale} pagination={true} />
    </div>
  );
}
