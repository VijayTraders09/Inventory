"use client";

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Button } from "../ui/button";
import { useEffect } from "react";
import { Input } from "../ui/input";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function ReturnPurchseItemsTable({ list, setItem }) {
  const CustomCell = ({ value }) => (
    <p className="text-black dark:white">{value}</p>
  );
  const EditButtonCell = ({ data }) => {
    return (
      <Button
        className="py-0 h-8"
        onClick={() => {
          console.clear()
          console.log(data)
          setItem(data);
        }}
      >
        Edit
      </Button>
    );
  };

  const columnDefs = [
    {
      headerName: "idx",
      field: "_id",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex: 1,
    },
    {
      headerName: "Category Name",
      field: "categoryName",
      sortable: true,
      filter: true,
      cellRenderer: ({ value }) => (
        <p className="text-black dark:white">{value}</p>
      ),
      flex: 2,
    },
    {
      headerName: "Product Name",
      field: "productName",
      sortable: true,
      filter: true,
      cellRenderer: ({ value }) => (
        <p className="text-black dark:white">{value}</p>
      ),
      flex: 2,
    },
    {
      headerName: "Purchased Quantity",
      field: "purchasedQuantity",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex: 1,
    },
    {
      headerName: "Quantity",
      field: "quantity",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex: 1,
    },
    {
      headerName: "Quantity",
      field: "_id",
      sortable: true,
      filter: true,
      cellRenderer: EditButtonCell,
      flex: 1,
    },
  ];

  return (
    <div className={`dark:text-red text-blue p-4 rounded-lg w-full h-60  `}>
      <AgGridReact columnDefs={columnDefs} rowData={list} pagination={true} />
    </div>
  );
}
