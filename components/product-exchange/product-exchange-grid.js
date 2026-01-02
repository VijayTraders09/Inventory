// components/product-exchange-grid.js
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
  ArrowRightLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import ProductExchangeForm from "./product-exchnage-form";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function ProductExchangeGrid() {
  const [exchanges, setExchanges] = useState([]);
  const [categories, setCategories] = useState([]);
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
  const [filterCategory, setFilterCategory] = useState(0);
  const [filterFromGodown, setFilterFromGodown] = useState(0);
  const [filterToGodown, setFilterToGodown] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [localSearch, setLocalSearch] = useState("");

  // Fetch exchanges
  const fetchExchanges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        search,
      });

      const response = await axios.get(`/api/product-exchange?${params}`);

      if (response.data.success) {
        setExchanges(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.data.error || "Failed to fetch exchanges");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "An error occurred while fetching exchanges"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for filters
  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/categories?limit=100");
      console.log(response)
      if (response.data.success) {
        console.log(response.data.data)
        setCategories(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch categories");
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
    fetchExchanges();
    fetchCategories();
    fetchGodowns();
  }, [currentPage, search, pagination.limit]);

  const handleView = (exchange) => {
    setSelectedExchange(exchange);
    setIsViewOpen(true);
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
      headerName: "From Product",
      field: "fromProductId.productName",
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
    },
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
      headerName: "To Product",
      field: "toProductId.productName",
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
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
      headerName: "Quantity",
      field: "quantity",
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
      width: 100,
      cellRenderer: (params) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleView(params.data)}
          disabled={loading}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Exchanges</h1>
          <p className="text-gray-600 mt-1">Manage product exchanges between godowns</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={loading}
        >
          <Plus className="mr-2 h-4 w-4" /> New Exchange
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search exchanges by remark..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            Search
          </Button>
        </form>
{/*         
        <div className="flex items-center gap-2">
          <Label>Category:</Label>
          <Select
            value={filterCategory}
            onValueChange={(value) => {
              setFilterCategory(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category._id} value={category._id}>
                  {category.categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
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
              <SelectItem value="">All</SelectItem>
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
              <SelectItem value="">All</SelectItem>
              {godowns.map((godown) => (
                <SelectItem key={godown._id} value={godown._id}>
                  {godown.godownName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div> */}
      </div>

      {/* AG Grid Table */}
      <div className="bg-white rounded-lg shadow border">
        <div
          className="ag-theme-alpine"
          style={{ height: "400px", width: "100%" }}
        >
          <AgGridReact
            rowData={exchanges}
            columnDefs={columnDefs}
            loading={loading}
            pagination={false}
            suppressPaginationPanel={true}
            overlayLoadingTemplate={
              '<div class="ag-overlay-loading-center">Loading exchanges...</div>'
            }
            overlayNoRowsTemplate={
              '<div class="ag-overlay-loading-center">No exchanges found</div>'
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

      {/* Product Exchange Form Dialog */}
      <ProductExchangeForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onExchangeComplete={fetchExchanges}
      />

      {/* View Exchange Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exchange Details</DialogTitle>
          </DialogHeader>
          {selectedExchange && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">From Product</p>
                  <p className="font-medium">
                    {selectedExchange.fromProductId.productName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">From Godown</p>
                  <p className="font-medium">
                    {selectedExchange.fromGodownId.godownName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To Product</p>
                  <p className="font-medium">
                    {selectedExchange.toProductId.productName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To Godown</p>
                  <p className="font-medium">
                    {selectedExchange.toGodownId.godownName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-medium">{selectedExchange.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">
                    {new Date(selectedExchange.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedExchange.remark && (
                <div>
                  <p className="text-sm text-gray-600">Remark</p>
                  <p className="font-medium">{selectedExchange.remark}</p>
                </div>
              )}

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
    </div>
  );
}