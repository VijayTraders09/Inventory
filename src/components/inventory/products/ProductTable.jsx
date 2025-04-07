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
import ProductQuantityTable from "./ProductQuantityTable";

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

  useEffect(() => {
    if (!fetched) dispatch(fetchProductsByCategory(categoryId));
    if(!quatityOpen) setSelectedProduct({})
    return () => {};
  }, [fetched,quatityOpen]);

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
      cellRenderer: EditButtonCell,
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
              quantity={selectedProduct?.quantity?.length?selectedProduct?.quantity:[]}
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
