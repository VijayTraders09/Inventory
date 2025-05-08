"use client";

import { fetchTransport } from "@/store/slices/transportSlice";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../ui/button";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function TransportTable({
  setSelectedTransport,
  setOpen,
  setFetchData,
  fetchData,
}) {
  const pathname = usePathname();

  const dispatch = useDispatch();

  const { transports, loading, error, fetched } = useSelector(
    (state) => state.transports
  );

  useEffect(() => {
    if (!fetched) dispatch(fetchTransport());
    return () => {};
  }, [fetched]);

  const CustomCell = ({ value }) => (
    <p className="text-black dark:white">{value}</p>
  );

  const EditButtonCell = ({ data }) => {
    return (
      <Button
        onClick={() => {
          setSelectedTransport(data);
          setOpen(true);
        }}
      >
        Edit
      </Button>
    );
  };

  const columnDefs = [
    {
      headerName: "Transport Name",
      field: "transport",
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
        rowData={transports}
        pagination={true}
      />
    </div>
  );
}
