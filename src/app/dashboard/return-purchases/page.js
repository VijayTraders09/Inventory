"use client";

import ItemsTable from "@/components/items-table/ItemsTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { fetchReturnPurchases } from "@/store/slices/returnPurchaseSlice";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function Orders() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const dispatch = useDispatch();
  const { returnPurchases, loading, error, fetched } = useSelector(
    (state) => state.returnPurchases
  );

  useEffect(() => {
    if (!fetched) dispatch(fetchReturnPurchases());
  }, []);

  const CustomCell = ({ value }) => {
    // console.log(value)
    return <p className="text-black dark:white">{value}</p>;
  };

  const SeeItems = ({ data }) => {
    return (
      <Button
        variant="outline"
        className="bg-buttonBg text-white"
        onClick={() => {
          setItems(data.items)
          setOpen(true)
        }}
        // onClick={setOpen(true)}
      >
        See Items
      </Button>
    );
  };

  const columnDefs = [
    {
      headerName: "Customer Name",
      field: "sellerId",
      sortable: true,
      filter: true,
      cellRenderer: ({ value }) => (
        <p className="text-black dark:white">{value.sellerName}</p>
      ),
      flex: 1,
    },
    {
      headerName: "Mode of transport",
      field: "modeOfTransport",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex: 1,
    },
    {
      headerName: "Invoice",
      field: "invoiceNumber",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex: 1,
    },
    {
      headerName: "Remark",
      field: "remark",
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

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Items</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <ItemsTable list={items} setList={setItems} hideRemove={true} />
          </div>
        </DialogContent>
      </Dialog>
      <div className={`dark:text-red text-blue p-4 rounded-lg w-full h-96 `}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={returnPurchases}
          pagination={true}
        />
      </div>
    </>
  );
}
