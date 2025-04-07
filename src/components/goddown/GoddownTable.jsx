"use client";

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import axios from "axios";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function GoddownTable({
  setSelectedGoddown,
  setOpen,
  setFetchData,
  fetchData,
  goddowns
}) {
  const pathname = usePathname();

  const CustomCell = ({ value }) => (
    <p className="text-black dark:white">{value}</p>
  );

  const EditButtonCell = ({ data }) => {
    return (
      <Button
        onClick={() => {
          setSelectedGoddown(data);
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
      headerName: "Goddown Name",
      field: "goddownName",
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
  return (
    <div className={`dark:text-red text-blue p-4 rounded-lg w-full h-96 `}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={goddowns}
        pagination={true}
      />
    </div>
  );
}
