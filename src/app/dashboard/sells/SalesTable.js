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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import axios from "axios";
import { toast } from "react-toastify";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function SalesTable({ selectedBuyer }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      >
        Edit
      </Button>
    );
  };

  const Delete = ({ data }) => {
    return (
      <AlertDialog open={deleteDialogOpen && saleToDelete?._id === data._id} onOpenChange={(open) => {
        if (!open) {
          setDeleteDialogOpen(false);
          setSaleToDelete(null);
        }
      }}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={() => {
              setSaleToDelete(data);
              setDeleteDialogOpen(true);
            }}
            disabled={isDeleting}
          >
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sale record for {data.buyerId?.buyerName} with invoice number {data.invoiceNumber}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSale(data._id);
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  const handleDeleteSale = async (saleId) => {
    try {
      setIsDeleting(true);
      
      // Make the API call to delete the sale
      const response = await axios.delete(`/api/sell?id=${saleId}`);
      
      if (response.data.success) {
        // Show success message
        toast.success(response.data.message || "Sale deleted successfully");
        
        // Close the dialog
        setDeleteDialogOpen(false);
        setSaleToDelete(null);
        
        // Refetch the sells after deletion
        if (selectedBuyer?._id) {
          dispatch(fetchSells(selectedBuyer._id));
        } else {
          dispatch(fetchSells());
        }
      } else {
        // Show error message
        toast.error(response.data.message || "Failed to delete sale");
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error(error.response?.data?.message || "Error deleting sale");
    } finally {
      setIsDeleting(false);
    }
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
      field: "createdAt",
      sortable: true,
      filter: "agDateColumnFilter",
      valueGetter: ({ data }) =>
        data?.createdAt ? new Date(data.createdAt) : null,
      valueFormatter: ({ value }) => {
        if (value) {
          const date = new Date(value);
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
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
      field: "edit",
      cellRenderer: Edit,
      flex: 1,
    },
    {
      headerName: "Delete",
      field: "delete",
      cellRenderer: Delete,
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