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
import { useRouter } from "next/navigation";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function SalesTable({ selectedBuyer }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const navigate = useRouter();
  const dispatch = useDispatch();
  const { sells, loading, error, fetched } = useSelector(
    (state) => state.sells
  );

  useEffect(() => {
    if (selectedBuyer?._id) dispatch(fetchSells(selectedBuyer?._id));
    else if (!fetched) dispatch(fetchSells());
  }, [selectedBuyer]);

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
          setItems(data.items);
          setOpen(true);
        }}
        // onClick={setOpen(true)}
      >
        See Items
      </Button>
    );
  };
  const Edit = ({ data }) => {
    return (
      <Button
        variant="outline"
        className="bg-buttonBg text-white"
        onClick={() => {
          navigate.push("/add-sale?data="+JSON.stringify(data));
        }}
        // onClick={setOpen(true)}
      >
        Edit
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
      headerName: "Date",
      field: "createdAt", // Make sure this matches your field name
      sortable: true,
      filter: "agDateColumnFilter",
      valueGetter: ({ data }) =>
        data?.createdAt ? new Date(data.createdAt) : null,
      valueFormatter: ({ value }) => {
        if (value) {
          const date = new Date(value);
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
          const year = date.getFullYear();
          return `${day}/${month}/${year}`; // Format as dd/mm/yyyy
        }
        return "";
      },
      comparator: (date1, date2) => {
        return date1.getTime() - date2.getTime();
      },
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
    {
      headerName: "Edit",
      field: "items",
      cellRenderer: Edit,
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
          rowData={sells}
          pagination={true}
        />
      </div>
    </>
  );
}
