"use client";

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Button } from "../ui/button";
import { useEffect } from "react";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function ItemsTable({ list, setList, hideRemove }) {
  const CustomCell = ({ value }) => (
    <p className="text-black dark:white">{value}</p>
  );

  const EditButtonCell = ({ data }) => {
    return (
      <Button
        className="py-0 h-8"
        onClick={() => {
          setList((prev) => prev.filter((item) => item.id !== data.id));
        }}
      >
        Remove
      </Button>
    );
  };

  const columnDefs = hideRemove
    ? [
        {
          headerName: "Category Name",
          field: "categoryId",
          sortable: true,
          filter: true,
          cellRenderer: ({value})=> <p className="text-black dark:white">{value.categoryName}</p>,
          flex: 2,
        },
        {
          headerName: "Product Name",
          field: "productId",
          sortable: true,
          filter: true,
          cellRenderer: ({value})=> <p className="text-black dark:white">{value.productName}</p>,
          flex: 2,
        },
        {
          headerName: "Goddown Name",
          field: "godownId",
          sortable: true,
          filter: true,
          cellRenderer: ({value})=> <p className="text-black dark:white">{value.goddownName}</p>,
          flex: 2,
        },
        {
          headerName: "Quantity",
          field: "quantity",
          sortable: true,
          filter: true,
          cellRenderer: CustomCell,
          flex: 1,
        },
      ]
    : [
        {
          headerName: "Category Name",
          field: "categoryName",
          sortable: true,
          filter: true,
          cellRenderer: CustomCell,
          flex: 2,
        },
        {
          headerName: "Product Name",
          field: "productName",
          sortable: true,
          filter: true,
          cellRenderer: CustomCell,
          flex: 2,
        },
        {
          headerName: "Goddown Name",
          field: "goddownName",
          sortable: true,
          filter: true,
          cellRenderer: CustomCell,
          flex: 2,
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
          headerName: "Action",
          field: "action",
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
