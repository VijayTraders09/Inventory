"use client";

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function ProductQuantityTable({
  quantity,
}) {

  const columnDefs = [
    {
      headerName: "Goddown Name",
      field: "godownId",
      sortable: true,
      filter: true,
      cellRenderer: ({ value }) => (
        <p className="text-black dark:white">{value.goddownName}</p>
      ),
      flex: 1,
    },
    {
      headerName: "Quantity",
      field: "quantity",
      sortable: true,
      filter: true,
      flex: 1,
    },
  ];

  return (
    <div className={`dark:text-red text-blue p-4 rounded-lg w-full h-96 `}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={quantity}
        pagination={true}
      />
    </div>
  );
}
