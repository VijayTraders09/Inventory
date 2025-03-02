"use client";

import { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Button } from "../ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function CategoryTable({
  setSelectedCategory,
  setOpen,
  setFetchData,
  fetchData,
}) {
  const [categories, setCategories] = useState([]);
  const pathname = usePathname();

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categories"));
      const products = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(products);
      setFetchData(false);
    } catch (error) {
      console.error("Error fetching products: ", error);
      setCategories([]);
    }
  };

  useEffect(() => {
    if (fetchData) fetchProducts();
    return () => {};
  }, [fetchData]);

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
    return <Link href={`${pathname}/products/${data.id}`}>See Products</Link>;
  };

  const columnDefs = [
    {
      headerName: "id",
      field: "id",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex:1
    },
    {
      headerName: "Category Name",
      field: "category",
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

  console.log(categories);

  const rowData = useMemo(
    () => [
      { id: 1, name: "Alice", age: 25 },
      { id: 2, name: "Bob", age: 30 },
      { id: 3, name: "Charlie", age: 35 },
    ],
    []
  );

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
