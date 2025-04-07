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

  const ProductButtonCell = ({ data }) => {
    return <Link href={`${pathname}/products/${data._id}`}>See Products</Link>;
  };

  const columnDefs = [
    {
      headerName: "Category Name",
      field: "categoryName",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex:1
    },
    {
      headerName: "Action",
      field: "action",
      sortable: true,
      filter: true,
      cellRenderer: EditButtonCell,
      flex:1
    },
    {
      headerName: "Products",
      field: "products",
      sortable: true,
      filter: true,
      cellRenderer: ProductButtonCell,
      flex:1
    },
  ];
console.log(fetchData)
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
