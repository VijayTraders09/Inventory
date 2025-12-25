"use client";

import { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByCategory } from "@/store/slices/productSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ProductQuantityTable from "./ProductQuantityTable";
import { toast } from "react-toastify";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function ProductTable({
  setSelectedProduct,
  setOpen,
  selectedProduct,
  categoryId,
}) {
  const dispatch = useDispatch();
  const { products, loading, error, fetched } = useSelector(
    (state) => state.products
  );
  const [quatityOpen, setQuatityOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!fetched) dispatch(fetchProductsByCategory(categoryId));
    if(!quatityOpen) setSelectedProduct({})
    return () => {};
  }, [fetched, quatityOpen]);

  const CustomCell = ({ value }) => (
    <p className="text-black dark:white">{value}</p>
  );

  const EditButtonCell = ({ data }) => {
    return (
      <Button
        onClick={() => {
          setSelectedProduct(data);
          setOpen(true);
        }}
      >
        Edit
      </Button>
    );
  };

  const DeleteButtonCell = ({ data }) => {
    return (
      <AlertDialog open={deleteDialogOpen && productToDelete?._id === data._id} onOpenChange={(open) => {
        if (!open) {
          setDeleteDialogOpen(false);
          setProductToDelete(null);
        }
      }}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="bg-red-500 text-white hover:bg-red-600 ml-2"
            onClick={() => {
              setProductToDelete(data);
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
              This action cannot be undone. This will permanently delete the product "{data.productName}".
              {data.sold > 0 && (
                <span className="text-red-600 font-semibold block mt-2">
                  Warning: This product has sales records ({data.sold} units sold). Deleting it may affect your sales history.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteProduct(data._id);
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

  const showQuantity = ({ data }) => {
    return (
      <Button
        onClick={() => {
          setSelectedProduct(data);
          setQuatityOpen(true);
        }}
      >
        Quantity
      </Button>
    );
  };

  const handleDeleteProduct = async (productId) => {
    try {
      setIsDeleting(true);
      
      // Make the API call to delete the product
      const response = await axios.delete(`/api/products?id=${productId}`);
      
      if (response.data.success) {
        // Show success message
        toast.success(response.data.message || "Product deleted successfully");
        
        // Close the dialog
        setDeleteDialogOpen(false);
        setProductToDelete(null);
        
        // Refetch the products after deletion
        dispatch(fetchProductsByCategory(categoryId));
      } else {
        // Show error message
        toast.error(response.data.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error.response?.data?.message || "Error deleting product");
    } finally {
      setIsDeleting(false);
    }
  };

  const columnDefs = [
    {
      headerName: "Product Name",
      field: "productName",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex: 1,
    },
    {
      headerName: "Action",
      field: "action",
      sortable: true,
      filter: true,
      cellRenderer: ({ data }) => (
        <div className="flex">
          <EditButtonCell data={data} />
          <DeleteButtonCell data={data} />
        </div>
      ),
      flex: 1,
    },
    {
      headerName: "Quantity",
      field: "quatity",
      sortable: true,
      filter: true,
      cellRenderer: showQuantity,
      flex: 1,
    },
  ];

  return (
    <div className={`dark:text-red text-blue p-4 rounded-lg w-full h-96 `}>
      <Dialog open={quatityOpen} onOpenChange={setQuatityOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Quantity ({selectedProduct?.productName})</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <ProductQuantityTable
              quantity={selectedProduct?.quantity?.length ? selectedProduct?.quantity : []}
              hideRemove={true}
            />
          </div>
        </DialogContent>
      </Dialog>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={products}
        pagination={true}
      />
    </div>
  );
}