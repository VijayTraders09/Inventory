"use client";

import { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function StockDetailsPopup({
  isOpen,
  onClose,
  stocks,
  godownName,
}) {
  const [loading, setLoading] = useState(false);

  // Column definitions for the stock table
  const stockColumnDefs = [
    {
      headerName: "Product Name",
      field: "productId.productName",
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      cellRenderer: (params) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{params.value}</span>
        </div>
      ),
    },
    {
      headerName: "Quantity",
      field: "quantity",
      sortable: true,
      filter: true,
      resizable: true,
      width: 120,
      cellRenderer: (params) => <Badge variant="outline">{params.value}</Badge>,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Details for "{godownName}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Stock Details</h3>
            </div>
            <div
              className="ag-theme-alpine"
              style={{ height: "300px", width: "100%" }}
            >
              <AgGridReact
                rowData={stocks}
                columnDefs={stockColumnDefs}
                loading={loading}
                pagination={false}
                domLayout="autoHeight"
                suppressPaginationPanel={true}
              />
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
