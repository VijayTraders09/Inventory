"use client";

import { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Button } from "../ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "@/store/slices/categorySlice";
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
import { toast } from "react-toastify";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function CategoryTable({
  setSelectedCategory,
  setOpen,
  setFetchData,
  fetchData,
}) {
  const pathname = usePathname();

  const dispatch = useDispatch();

  const { categories, loading, error, fetched } = useSelector(
    (state) => state.categories
  );

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!fetched) dispatch(fetchCategories());
    return () => {};
  }, [fetched]);

  const CustomCell = ({ value }) => (
    <p className="text-black dark:white">{value}</p>
  );

  const EditButtonCell = ({ data }) => {
    return (
      <Button
        onClick={() => {
          setSelectedCategory(data);
          setOpen(true);
        }}
      >
        Edit
      </Button>
    );
  };

  const DeleteButtonCell = ({ data }) => {
    return (
      <AlertDialog open={deleteDialogOpen && categoryToDelete?._id === data._id} onOpenChange={(open) => {
        if (!open) {
          setDeleteDialogOpen(false);
          setCategoryToDelete(null);
        }
      }}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="bg-red-500 text-white hover:bg-red-600 ml-2"
            onClick={() => {
              setCategoryToDelete(data);
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
              This action cannot be undone. This will permanently delete the category "{data.categoryName}".
              {data.products && data.products.length > 0 && (
                <span className="text-red-600 font-semibold block mt-2">
                  Warning: This category has {data.products.length} products. You must delete or reassign these products before deleting the category.
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
                handleDeleteCategory(data._id);
              }}
              disabled={isDeleting || (data.products && data.products.length > 0)}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  const ProductButtonCell = ({ data }) => {
    return <Link href={`${pathname}/products/${data._id}`}>See Products</Link>;
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      setIsDeleting(true);
      
      // Make the API call to delete the category
      const response = await axios.delete(`/api/category?id=${categoryId}`);
      
      if (response.data.success) {
        // Show success message
        toast.success(response.data.message || "Category deleted successfully");
        
        // Close the dialog
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
        
        // Refetch the categories after deletion
        dispatch(fetchCategories());
        
        // If setFetchData is provided, update it to trigger a refresh in the parent component
        if (setFetchData) {
          setFetchData(!fetchData);
        }
      } else {
        // Show error message
        toast.error(response.data.message || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(error.response?.data?.message || "Error deleting category");
    } finally {
      setIsDeleting(false);
    }
  };

  const columnDefs = [
    {
      headerName: "Category Name",
      field: "categoryName",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex: 1
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
      flex: 1
    },
    {
      headerName: "Products",
      field: "products",
      sortable: true,
      filter: true,
      cellRenderer: ProductButtonCell,
      flex: 1
    },
  ];

  return (
    <div className={`dark:text-red text-blue p-4 rounded-lg w-full h-96 `}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={categories}
        pagination={true}
      />
    </div>
  );
}