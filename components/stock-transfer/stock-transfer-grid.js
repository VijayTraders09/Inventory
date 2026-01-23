"use client";

import { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Building,
  Eye,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import StockTransferForm from "./stock-transfer-form";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function StockTransferGrid() {
  const [transfers, setTransfers] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterFromGodown, setFilterFromGodown] = useState("");
  const [filterToGodown, setFilterToGodown] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [localSearch, setLocalSearch] = useState("");

  // Fetch transfers
  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        search,
        fromGodownId: filterFromGodown||"",
        toGodownId: filterToGodown||"",
      });

      const response = await axios.get(`/api/stock-transfer?${params}`);

      if (response.data.success) {
        setTransfers(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.data.error || "Failed to fetch transfers");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "An error occurred while fetching transfers"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch godowns for filters
  const fetchGodowns = async () => {
    try {
      const response = await axios.get("/api/godown?limit=100");
      if (response.data.success) {
        setGodowns(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch godowns");
    }
  };

  useEffect(() => {
    fetchTransfers();
    fetchGodowns();
  }, [currentPage, search, pagination.limit, filterFromGodown, filterToGodown]);

  const handleView = (transfer) => {
    setSelectedTransfer(transfer);
    setIsViewOpen(true);
  };

  const handleDelete = (transfer) => {
    setSelectedTransfer(transfer);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTransfer) return;
    
    setLoading(true);
    try {
      const response = await axios.delete(`/api/stock-transfer?id=${selectedTransfer._id}`);
      
      if (response.data.success) {
        toast.success("Stock transfer deleted successfully");
        setIsDeleteOpen(false);
        setSelectedTransfer(null);
        fetchTransfers(); // Refresh the data
      } else {
        toast.error(response.data.error || "Failed to delete stock transfer");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "An error occurred while deleting the stock transfer"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(localSearch);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, limit: newLimit }));
    setCurrentPage(1);
  };

  const columnDefs = [
    {
      headerName: "From Godown",
      field: "fromGodownId.godownName",
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      cellRenderer: (params) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{params.value}</span>
        </div>
      ),
    },
    {
      headerName: "To Godown",
      field: "toGodownId.godownName",
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      cellRenderer: (params) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{params.value}</span>
        </div>
      ),
    },
    {
      headerName: "Total Items",
      field: "totalItems",
      sortable: true,
      filter: true,
      resizable: true,
      width: 120,
      cellRenderer: (params) => (
        <Badge variant="outline">{params.value}</Badge>
      ),
    },
    {
      headerName: "Remark",
      field: "remark",
      sortable: true,
      filter: true,
      resizable: true,
      width: 150,
    },
    {
      headerName: "Date",
      field: "createdAt",
      sortable: true,
      filter: true,
      resizable: true,
      width: 150,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString();
      },
    },
    {
      headerName: "Actions",
      field: "_id",
      sortable: false,
      filter: false,
      resizable: false,
      width: 150,
      cellRenderer: (params) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleView(params.data)}
            disabled={loading}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(params.data)}
            disabled={loading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Transfers</h1>
          <p className="text-gray-600 mt-1">Manage stock transfers between godowns</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={loading}
        >
          <Plus className="mr-2 h-4 w-4" /> New Transfer
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search transfers by remark..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            Search
          </Button>
        </form>
        
        <div className="flex items-center gap-2">
          <Label>From:</Label>
          <Select
            value={filterFromGodown}
            onValueChange={(value) => {
              setFilterFromGodown(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={0}>All</SelectItem>
              {godowns.map((godown) => (
                <SelectItem key={godown._id} value={godown._id}>
                  {godown.godownName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Label>To:</Label>
          <Select
            value={filterToGodown}
            onValueChange={(value) => {
              setFilterToGodown(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={0}>All</SelectItem>
              {godowns.map((godown) => (
                <SelectItem key={godown._id} value={godown._id}>
                  {godown.godownName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* AG Grid Table */}
      <div className="bg-white rounded-lg shadow border">
        <div
          className="ag-theme-alpine"
          style={{ height: "400px", width: "100%" }}
        >
          <AgGridReact
            rowData={transfers}
            columnDefs={columnDefs}
            loading={loading}
            pagination={false}
            suppressPaginationPanel={true}
            overlayLoadingTemplate={
              '<div class="ag-overlay-loading-center">Loading transfers...</div>'
            }
            overlayNoRowsTemplate={
              '<div class="ag-overlay-loading-center">No transfers found</div>'
            }
          />
        </div>
      </div>

      {/* Custom Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Stock Transfer Form Dialog */}
      <StockTransferForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onTransferComplete={fetchTransfers}
      />

      {/* View Transfer Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transfer Details</DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">From Godown</p>
                  <p className="font-medium">
                    {selectedTransfer.fromGodownId.godownName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To Godown</p>
                  <p className="font-medium">
                    {selectedTransfer.toGodownId.godownName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="font-medium">{selectedTransfer.totalItems}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">
                    {new Date(selectedTransfer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedTransfer.remark && (
                <div>
                  <p className="text-sm text-gray-600">Remark</p>
                  <p className="font-medium">{selectedTransfer.remark}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-2">Transfer Items</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">
                          Product
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">
                          Category
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedTransfer.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm">
                            {item.productId.productName}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {item.categoryId.categoryName}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {item.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsViewOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this stock transfer?</p>
            <p className="text-sm text-gray-500 mt-2">
              This action will reverse the stock transfer and update inventory levels.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}