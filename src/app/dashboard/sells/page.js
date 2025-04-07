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
import { useDispatch, useSelector } from "react-redux";
import { fetchSells } from "@/store/slices/sellSlice";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function Orders() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const dispatch = useDispatch();
  const { sells, loading, error, fetched } = useSelector(
    (state) => state.sells
  );

  useEffect(() => {
    if (!fetched) dispatch(fetchSells());
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
      field: "buyerId",
      sortable: true,
      filter: true,
      cellRenderer: ({ value }) => (
        <p className="text-black dark:white">{value.buyerName}</p>
      ),
      flex: 1,
    },
    // {
    //   headerName: "Goddown",
    //   field: "godownId",
    //   sortable: true,
    //   filter: true,
    //   cellRenderer: ({ value }) => (
    //     <p className="text-black dark:white">{value.goddownName}</p>
    //   ),
    //   flex: 1,
    // },
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

  console.log(sells);
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {/* <DialogTrigger>
          <Button
            variant="outline"
            className="bg-buttonBg text-white"
            onClick={() => setItems(data.items)}
            // onClick={setOpen(true)}
          >
            See Items
          </Button>
        </DialogTrigger> */}
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
          rowData={sells}
          pagination={true}
        />
      </div>
    </>
  );
}
