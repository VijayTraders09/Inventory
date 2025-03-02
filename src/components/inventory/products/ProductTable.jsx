"use client";

import { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function ProductTable({
  setSelectedProduct,
  setOpen,
  setFetchData,
  fetchData,
  categoryId
}) {
  const [Products, setProducts] = useState([]);
  const fetchProducts = async () => {
    try {

      const q = query(collection(db, "products"), where("categoryId", "==", categoryId));
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(products);
      setFetchData(false);
    } catch (error) {
      console.error("Error fetching products: ", error);
      setProducts([]);
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
      field: "id",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex:1
    },
    {
      headerName: "Product Name",
      field: "product",
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
  ];

  console.log(Products);

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
        rowData={Products}
        pagination={true}
      />
    </div>
  );
}
