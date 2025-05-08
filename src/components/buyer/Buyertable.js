"use client";

import { fetchTransport } from "@/store/slices/transportSlice";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../ui/button";
import { fetchBuyer } from "@/store/slices/buyerSlice";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function Buyertable({
  setSelectedBuyer,
  setOpen,
  setOpenSalesTable,
  fetchData,
}) {
  const pathname = usePathname();

  const dispatch = useDispatch();

  const { buyers, loading, error, fetched } = useSelector(
    (state) => state.buyers
  );

  useEffect(() => {
    if (!fetched) dispatch(fetchBuyer());
    return () => {};
  }, [fetched]);

  const CustomCell = ({ value }) => (
    <p className="text-black dark:white">{value}</p>
  );

  const EditButtonCell = ({ data }) => {
    return (
      <Button
        onClick={() => {
          setSelectedBuyer(data);
          setOpen(true);
        }}
      >
        Edit
      </Button>
    );
  };

  const SeeItems = ({ data }) => {
    return (
      <Button
        variant="outline"
        className="bg-buttonBg text-white"
        onClick={() => {
          setOpenSalesTable(true)
          setSelectedBuyer(data)
          console.log(data)
        }}
        // onClick={setOpen(true)}
      >
        See Items
      </Button>
    );
  };

  const columnDefs = [
    {
      headerName: "Customer Name",
      field: "buyerName",
      sortable: true,
      filter: true,
      cellRenderer: CustomCell,
      flex:1
    },
    {
        headerName: "Number",
        field: "mobileNumber",
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
        headerName: "Sales",
        field: "sales",
        sortable: true,
        filter: true,
        cellRenderer: SeeItems,
        flex: 1,
      },
  ];

  return (
    <div className={`dark:text-red text-blue p-4 rounded-lg w-full h-96 `}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={buyers}
        pagination={true}
      />
    </div>
  );
}
