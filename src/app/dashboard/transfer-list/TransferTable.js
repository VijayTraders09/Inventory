"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function TransferTable() {
  const [open, setOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [records, setRecords] = useState([]);

  const router = useRouter();

  useEffect(() => {
    fetchTransferRecords();
  }, []);

  const fetchTransferRecords = async () => {
    try {
      const res = await fetch("/api/goddown/transfer-godown");
      const json = await res.json();
      if (json.success) {
        setRecords(json.data);
      }
    } catch (err) {
      console.error("Error fetching transfer records", err);
    }
  };

  // ---- Custom Cell Renderers ----
  const TextCell = ({ value }) => <p className="text-black dark:white">{value}</p>;

  const ViewDetails = ({ data }) => {
    return (
      <Button
        variant="outline"
        className="bg-buttonBg text-white"
        onClick={() => {
          setSelectedRecord(data);
          setOpen(true);
        }}
      >
        View
      </Button>
    );
  };

  // ---- Columns for Transfer Records ----
  const columnDefs = [
    {
      headerName: "From Godown",
      field: "fromGodown",
      sortable: true,
      filter: true,
      cellRenderer: ({ value }) => <p>{value?.goddownName}</p>,
      flex: 1,
    },
    {
      headerName: "To Godown",
      field: "toGodown",
      sortable: true,
      filter: true,
      cellRenderer: ({ value }) => <p>{value?.goddownName}</p>,
      flex: 1,
    },
    {
      headerName: "Product",
      field: "productId",
      sortable: true,
      filter: true,
      cellRenderer: ({ value }) => <p>{value?.productName}</p>,
      flex: 1,
    },
    {
      headerName: "Quantity",
      field: "quantity",
      sortable: true,
      filter: true,
      cellRenderer: TextCell,
      flex: 1,
    },
    {
      headerName: "Date",
      field: "createdAt",
      sortable: true,
      filter: "agDateColumnFilter",
      valueGetter: ({ data }) =>
        data?.createdAt ? new Date(data.createdAt) : null,
      valueFormatter: ({ value }) => {
        if (!value) return "";
        const d = new Date(value);
        return `${String(d.getDate()).padStart(2, "0")}/${String(
          d.getMonth() + 1
        ).padStart(2, "0")}/${d.getFullYear()}`;
      },
      comparator: (a, b) => a - b,
      flex: 1,
    },
    {
      headerName: "View",
      field: "view",
      cellRenderer: ViewDetails,
      flex: 1,
    },
  ];

  return (
    <>
      {/* View Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Transfer Details</DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-3 text-black dark:text-white">
              <p><strong>From:</strong> {selectedRecord.fromGodown.goddownName}</p>
              <p><strong>To:</strong> {selectedRecord.toGodown.goddownName}</p>
              <p><strong>Product:</strong> {selectedRecord.productId.productName}</p>
              <p><strong>Quantity:</strong> {selectedRecord.quantity}</p>
              <p><strong>Date:</strong> {new Date(selectedRecord.createdAt).toLocaleString()}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AG Grid Table */}
      <div className="dark:text-red text-blue p-4 rounded-lg w-full h-96">
        <AgGridReact
          columnDefs={columnDefs}
          rowData={records}
          pagination={true}
        />
      </div>
    </>
  );
}
