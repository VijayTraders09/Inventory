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

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function ProductTable({
  setSelectedProduct,
  setOpen,
  categoryId,
}) {

  const dispatch = useDispatch();
  const { products, loading, error, fetched } = useSelector(
    (state) => state.products
  );

  useEffect(() => {
    if (!fetched) dispatch(fetchProductsByCategory(categoryId));
    return () => {};
  }, [fetched]);

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

  const columnDefs = [
    {
      headerName: "id",
      field: "_id",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex: 1,
    },
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
  ];

  return (
    <div className={`dark:text-red text-blue p-4 rounded-lg w-full h-96 `}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={products}
        pagination={true}
      />
    </div>
  );
}
