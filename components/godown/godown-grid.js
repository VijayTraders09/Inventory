"use client";

import { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus,
  Edit,
  Trash2,
  Building,
  Search,
  Download,
  Package,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import Link from "next/link";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function GodownGrid() {
  // Local state
  const [godowns, setGodowns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingIndividual, setExportingIndividual] = useState({});
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGodown, setSelectedGodown] = useState(null);
  const [formData, setFormData] = useState({
    godownName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  // New states for stocks modal
  const [isStocksModalOpen, setIsStocksModalOpen] = useState(false);
  const [selectedGodownForStocks, setSelectedGodownForStocks] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [stocksSearch, setStocksSearch] = useState("");
  const [stocksPagination, setStocksPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [stocksCurrentPage, setStocksCurrentPage] = useState(1);

  // Fetch godowns
  const fetchGodowns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        search,
      });

      const response = await axios.get(`/api/godown?${params}`);

      if (response.data.success) {
        setGodowns(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.data.error || "Failed to fetch godowns");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "An error occurred while fetching godowns",
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch stocks for a specific godown
  const fetchStocksForGodown = async (godownId, page = 1, search = "") => {
    setStocksLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: stocksPagination.limit.toString(),
        search,
      });

      const response = await axios.get(
        `/api/godown/get-stocks-by-godown/${godownId}/?${params}`,
      );

      if (response.data.success) {
        setStocks(response.data.data);
        setStocksPagination(response.data.pagination);
      } else {
        toast.error(response.data.error || "Failed to fetch stocks");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "An error occurred while fetching stocks",
      );
    } finally {
      setStocksLoading(false);
    }
  };

  useEffect(() => {
    fetchGodowns();
  }, [currentPage, search]);

  useEffect(() => {
    if (selectedGodownForStocks) {
      fetchStocksForGodown(
        selectedGodownForStocks._id,
        stocksCurrentPage,
        stocksSearch,
      );
    }
  }, [stocksCurrentPage, stocksSearch]);

  // Export individual godown data
  const handleEdit = (godown) => {
    setSelectedGodown(godown);
    setFormData({
      godownName: godown.godownName,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (godown) => {
    setSelectedGodown(godown);
    setIsDeleteOpen(true);
  };

  const handleViewStocks = (godown) => {
    setSelectedGodownForStocks(godown);
    setStocksCurrentPage(1);
    setStocksSearch("");
    setIsStocksModalOpen(true);
    fetchStocksForGodown(godown._id);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleStocksPageChange = (page) => {
    setStocksCurrentPage(page);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(localSearch);
    setCurrentPage(1);
  };

  const handleStocksSearch = (e) => {
    e.preventDefault();
    setStocksCurrentPage(1);
    fetchStocksForGodown(selectedGodownForStocks._id, 1, stocksSearch);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let response;
      if (selectedGodown) {
        response = await axios.put(
          `/api/godown/${selectedGodown._id}`,
          formData,
        );
      } else {
        response = await axios.post("/api/godown", formData);
      }

      if (response.data.success) {
        toast.success(
          response.data.message ||
            (selectedGodown
              ? "Godown updated successfully"
              : "Godown created successfully"),
        );
        setIsFormOpen(false);
        setFormData({ godownName: "" });
        setSelectedGodown(null);
        fetchGodowns(); // Refresh godowns list
      } else {
        toast.error(response.data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGodown = async () => {
    if (!selectedGodown) return;

    try {
      const response = await axios.delete(`/api/godown/${selectedGodown._id}`);

      if (response.data.success) {
        toast.success("Godown deleted successfully");
        setIsDeleteOpen(false);
        setSelectedGodown(null);
        fetchGodowns(); // Refresh godowns list
      } else {
        toast.error(response.data.error || "Failed to delete godown");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete godown");
    }
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Godown Name",
        field: "godownName",
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
        headerName: "Created Date",
        field: "createdAt",
        sortable: true,
        filter: true,
        resizable: true,
        width: 180,
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
        width: 280,
        cellRenderer: (params) => (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewStocks(params.data)}
              disabled={loading}
              title="View stocks in this godown"
            >
              <Package className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || exportingIndividual[params.data._id]}
              title="Export this godown's stock data"
            >
              <Link
                target="_blank"
                href={`http://localhost:3000//api/godown/stock-report/${params.data._id}`}
              >
                {exportingIndividual[params.data._id] ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(params.data)}
              disabled={loading}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(params.data)}
              className="text-red-600 hover:text-red-700"
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [loading, exportingIndividual],
  );

  const stocksColumnDefs = useMemo(
    () => [
      {
        headerName: "Product Name",
        field: "productName",
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
      },
      {
        headerName: "Category",
        field: "categoryName",
        sortable: true,
        filter: true,
        resizable: true,
        width: 180,
      },
      {
        headerName: "Quantity",
        field: "quantity",
        sortable: true,
        filter: false,
        resizable: true,
        width: 120,
        cellRenderer: (params) => (
          <span className="font-medium">{params.value}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Godowns</h1>
          <p className="text-gray-600 mt-1">Manage your warehouse locations</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={loading || exporting}
          >
            <Link
              className="flex gap-1 items-center"
              href={`http://localhost:3000//api/godown/export-stocks`}
            >
              {exporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export All
            </Link>
          </Button>
          <Button
            onClick={() => {
              setSelectedGodown(null);
              setFormData({ godownName: "" });
              setIsFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Godown
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search godowns..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={loading}>
          Search
        </Button>
      </form>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Godowns</p>
              <p className="text-2xl font-bold">{pagination.total}</p>
            </div>
            <Building className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Page</p>
              <p className="text-2xl font-bold">
                {currentPage} of {pagination.pages}
              </p>
            </div>
            <div className="text-sm text-gray-500 border rounded px-2 py-1">
              {pagination.limit} per page
            </div>
          </div>
        </div>
      </div>

      {/* AG Grid Table */}
      <div className="bg-white rounded-lg shadow border">
        <div
          className="ag-theme-alpine"
          style={{ height: "400px", width: "100%" }}
        >
          <AgGridReact
            rowData={godowns}
            columnDefs={columnDefs}
            loading={loading}
            pagination={false}
            suppressPaginationPanel={true}
            overlayLoadingTemplate={
              '<div class="ag-overlay-loading-center">Loading godowns...</div>'
            }
            overlayNoRowsTemplate={
              '<div class="ag-overlay-loading-center">No godowns found</div>'
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

      {/* Godown Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedGodown ? "Edit Godown" : "Add New Godown"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="godownName">Godown Name *</Label>
              <Input
                id="godownName"
                value={formData.godownName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    godownName: e.target.value,
                  }))
                }
                placeholder="Enter godown name"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : selectedGodown
                    ? "Update"
                    : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Godown</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedGodown?.godownName}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGodown}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stocks Modal */}
      <Dialog open={isStocksModalOpen} onOpenChange={setIsStocksModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>
                Stocks in {selectedGodownForStocks?.godownName}
              </DialogTitle>
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsStocksModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button> */}
            </div>
          </DialogHeader>

          {/* Search Bar for Stocks */}
          <form onSubmit={handleStocksSearch} className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={stocksSearch}
                onChange={(e) => setStocksSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={stocksLoading}>
              Search
            </Button>
          </form>

          {/* Stocks Table */}
          <div className="mt-4">
            <div
              className="ag-theme-alpine"
              style={{ height: "400px", width: "100%" }}
            >
              <AgGridReact
                rowData={stocks}
                columnDefs={stocksColumnDefs}
                loading={stocksLoading}
                pagination={false}
                suppressPaginationPanel={true}
                overlayLoadingTemplate={
                  '<div class="ag-overlay-loading-center">Loading stocks...</div>'
                }
                overlayNoRowsTemplate={
                  '<div class="ag-overlay-loading-center">No stocks found</div>'
                }
              />
            </div>
          </div>

          {/* Pagination for Stocks */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing {(stocksPagination.page - 1) * stocksPagination.limit + 1}{" "}
              to{" "}
              {Math.min(
                stocksPagination.page * stocksPagination.limit,
                stocksPagination.total,
              )}{" "}
              of {stocksPagination.total} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleStocksPageChange(stocksPagination.page - 1)
                }
                disabled={stocksPagination.page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {stocksPagination.page} of {stocksPagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleStocksPageChange(stocksPagination.page + 1)
                }
                disabled={stocksPagination.page >= stocksPagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
