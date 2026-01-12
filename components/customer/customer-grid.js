"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Search,
  Eye,
  Download,
  X,
  Package,
  Calendar,
  Truck,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import * as XLSX from "xlsx";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function CustomerGrid() {
  // Local state
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
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
  const [isPurchaseViewOpen, setIsPurchaseViewOpen] = useState(false);
  const [isSellViewOpen, setIsSellViewOpen] = useState(false);
  const [isPurchaseDetailsOpen, setIsPurchaseDetailsOpen] = useState(false);
  const [isSellDetailsOpen, setIsSellDetailsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedSell, setSelectedSell] = useState(null);
  const [purchaseData, setPurchaseData] = useState([]);
  const [sellData, setSellData] = useState([]);
  const [purchasePagination, setPurchasePagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [sellPagination, setSellPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [sellSearch, setSellSearch] = useState("");
  const [purchaseCurrentPage, setPurchaseCurrentPage] = useState(1);
  const [sellCurrentPage, setSellCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    customerName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  // Fetch customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        search,
      });

      const response = await axios.get(`/api/customer?${params}`);

      if (response.data.success) {
        setCustomers(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.data.error || "Failed to fetch customers");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "An error occurred while fetching customers"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch purchase data for a customer
  const fetchPurchaseData = async (customerId) => {
    try {
      const params = new URLSearchParams({
        customerId: customerId,
        page: purchaseCurrentPage.toString(),
        limit: purchasePagination.limit.toString(),
        search: purchaseSearch,
      });

      const response = await axios.get(`/api/purchase/by-customer?${params}`);

      if (response.data.success) {
        setPurchaseData(response.data.data);
        setPurchasePagination(response.data.pagination);
      } else {
        toast.error(response.data.error || "Failed to fetch purchase data");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "An error occurred while fetching purchase data"
      );
    }
  };

  // Fetch sell data for a customer
  const fetchSellData = async (customerId) => {
    try {
      const params = new URLSearchParams({
        customerId: customerId,
        page: sellCurrentPage.toString(),
        limit: sellPagination.limit.toString(),
        search: sellSearch,
      });

      const response = await axios.get(`/api/sell/by-customer?${params}`);

      if (response.data.success) {
        setSellData(response.data.data);
        setSellPagination(response.data.pagination);
      } else {
        toast.error(response.data.error || "Failed to fetch sell data");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "An error occurred while fetching sell data"
      );
    }
  };

  // Export purchase data to Excel (frontend)
  const exportPurchaseToExcel = async () => {
    try {
      // Get all purchase data for the customer (no pagination)
      const params = new URLSearchParams({
        customerId: selectedCustomer._id,
        search: purchaseSearch,
        limit: "1000", // Set a high limit to get all data
      });

      const response = await axios.get(`/api/purchase/by-customer?${params}`);

      if (response.data.success) {
        const allPurchaseData = response.data.data;

        // Prepare data for Excel export
        const exportData = [];

        allPurchaseData.forEach((purchase) => {
          if (purchase.stockEntries && purchase.stockEntries.length > 0) {
            purchase.stockEntries.forEach((entry, index) => {
              exportData.push({
                Invoice: purchase.invoice || "N/A",
                Date: new Date(purchase.createdAt).toLocaleDateString(),
                "Mode of Transport": purchase.modeOfTransport || "N/A",
                Remark: purchase.remark || "N/A",
                "Item #": index + 1,
                Category: entry.categoryId?.categoryName || "N/A",
                Product: entry.productId?.productName || "N/A",
                Godown: entry.godownId?.godownName || "N/A",
                Quantity: entry.quantity || 0,
              });
            });
          } else {
            exportData.push({
              Invoice: purchase.invoice || "N/A",
              Date: new Date(purchase.createdAt).toLocaleDateString(),
              "Mode of Transport": purchase.modeOfTransport || "N/A",
              Remark: purchase.remark || "N/A",
              "Item #": "N/A",
              Category: "N/A",
              Product: "N/A",
              Godown: "N/A",
              Quantity: 0,
            });
          }
        });

        // Create a new workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Purchases");

        // Generate buffer
        const buffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "buffer",
        });

        // Create a download link
        const url = window.URL.createObjectURL(new Blob([buffer]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `purchases_${selectedCustomer.customerName.replace(/\s+/g, "_")}.xlsx`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();

        toast.success("Purchase data exported successfully");
      } else {
        toast.error(
          response.data.error || "Failed to fetch purchase data for export"
        );
      }
    } catch (error) {
      console.error("Error exporting purchase data:", error);
      toast.error("Failed to export purchase data");
    }
  };

  // Export sell data to Excel (frontend)
  const exportSellToExcel = async () => {
    try {
      // Get all sell data for the customer (no pagination)
      const params = new URLSearchParams({
        customerId: selectedCustomer._id,
        search: sellSearch,
        limit: "1000", // Set a high limit to get all data
      });

      const response = await axios.get(`/api/sell/by-customer?${params}`);

      if (response.data.success) {
        const allSellData = response.data.data;

        // Prepare data for Excel export
        const exportData = [];

        allSellData.forEach((sell) => {
          if (sell.stockEntries && sell.stockEntries.length > 0) {
            sell.stockEntries.forEach((entry, index) => {
              exportData.push({
                Invoice: sell.invoice || "N/A",
                Date: new Date(sell.createdAt).toLocaleDateString(),
                "Mode of Transport": sell.modeOfTransport || "N/A",
                Remark: sell.remark || "N/A",
                "Item #": index + 1,
                Category: entry.categoryId?.categoryName || "N/A",
                Product: entry.productId?.productName || "N/A",
                Godown: entry.godownId?.godownName || "N/A",
                Quantity: entry.quantity || 0,
              });
            });
          } else {
            exportData.push({
              Invoice: sell.invoice || "N/A",
              Date: new Date(sell.createdAt).toLocaleDateString(),
              "Mode of Transport": sell.modeOfTransport || "N/A",
              Remark: sell.remark || "N/A",
              "Item #": "N/A",
              Category: "N/A",
              Product: "N/A",
              Godown: "N/A",
              Quantity: 0,
            });
          }
        });

        // Create a new workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sells");

        // Generate buffer
        const buffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "buffer",
        });

        // Create a download link
        const url = window.URL.createObjectURL(new Blob([buffer]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `sells_${selectedCustomer.customerName.replace(/\s+/g, "_")}.xlsx`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();

        toast.success("Sell data exported successfully");
      } else {
        toast.error(
          response.data.error || "Failed to fetch sell data for export"
        );
      }
    } catch (error) {
      console.error("Error exporting sell data:", error);
      toast.error("Failed to export sell data");
    }
  };

  // Export customer data to Excel (frontend)
  const exportCustomersToExcel = async () => {
    try {
      // Get all customer data (no pagination)
      const params = new URLSearchParams({
        search: search,
        limit: "1000", // Set a high limit to get all data
      });

      const response = await axios.get(`/api/customer?${params}`);

      if (response.data.success) {
        const allCustomers = response.data.data;

        // Prepare data for Excel export
        const exportData = allCustomers.map((customer) => ({
          "Customer Name": customer.customerName || "N/A",
          "Created Date": new Date(customer.createdAt).toLocaleDateString(),
          "Updated Date": new Date(customer.updatedAt).toLocaleDateString(),
        }));

        // Create a new workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

        // Generate buffer
        const buffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "buffer",
        });

        // Create a download link
        const url = window.URL.createObjectURL(new Blob([buffer]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "customers.xlsx");
        document.body.appendChild(link);
        link.click();
        link.remove();

        toast.success("Customer data exported successfully");
      } else {
        toast.error(
          response.data.error || "Failed to fetch customer data for export"
        );
      }
    } catch (error) {
      console.error("Error exporting customer data:", error);
      toast.error("Failed to export customer data");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, search, pagination.limit]);

  useEffect(() => {
    if (selectedCustomer && isPurchaseViewOpen) {
      fetchPurchaseData(selectedCustomer._id);
    }
  }, [
    purchaseCurrentPage,
    purchaseSearch,
    selectedCustomer,
    isPurchaseViewOpen,
  ]);

  useEffect(() => {
    if (selectedCustomer && isSellViewOpen) {
      fetchSellData(selectedCustomer._id);
    }
  }, [sellCurrentPage, sellSearch, selectedCustomer, isSellViewOpen]);

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      customerName: customer.customerName,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (customer) => {
    setSelectedCustomer(customer);
    setIsDeleteOpen(true);
  };

  const handleViewPurchases = (customer) => {
    setSelectedCustomer(customer);
    setPurchaseCurrentPage(1);
    setPurchaseSearch("");
    setIsPurchaseViewOpen(true);
  };

  const handleViewSells = (customer) => {
    setSelectedCustomer(customer);
    setSellCurrentPage(1);
    setSellSearch("");
    setIsSellViewOpen(true);
  };

  const handleViewPurchaseDetails = (purchase) => {
    setSelectedPurchase(purchase);
    setIsPurchaseDetailsOpen(true);
  };

  const handleViewSellDetails = (sell) => {
    setSelectedSell(sell);
    setIsSellDetailsOpen(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePurchasePageChange = (page) => {
    setPurchaseCurrentPage(page);
  };

  const handleSellPageChange = (page) => {
    setSellCurrentPage(page);
  };

  const handleLimitChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, limit: newLimit }));
    setCurrentPage(1);
  };

  const handlePurchaseLimitChange = (newLimit) => {
    setPurchasePagination((prev) => ({ ...prev, limit: newLimit }));
    setPurchaseCurrentPage(1);
  };

  const handleSellLimitChange = (newLimit) => {
    setSellPagination((prev) => ({ ...prev, limit: newLimit }));
    setSellCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(localSearch);
    setCurrentPage(1);
  };

  const handlePurchaseSearch = (e) => {
    e.preventDefault();
    setPurchaseCurrentPage(1);
  };

  const handleSellSearch = (e) => {
    e.preventDefault();
    setSellCurrentPage(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let response;
      if (selectedCustomer) {
        response = await axios.put(
          `/api/customer/${selectedCustomer._id}`,
          formData
        );
      } else {
        response = await axios.post("/api/customer", formData);
      }

      if (response.data.success) {
        toast.success(
          response.data.message ||
            (selectedCustomer
              ? "Customer updated successfully"
              : "Customer created successfully")
        );
        setIsFormOpen(false);
        setFormData({ customerName: "" });
        setSelectedCustomer(null);
        fetchCustomers(); // Refresh customers list
      } else {
        toast.error(response.data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await axios.delete(
        `/api/customer/${selectedCustomer._id}`
      );

      if (response.data.success) {
        toast.success("Customer deleted successfully");
        setIsDeleteOpen(false);
        setSelectedCustomer(null);
        fetchCustomers(); // Refresh customers list
      } else {
        toast.error(response.data.error || "Failed to delete customer");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete customer");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const customerColumnDefs = useMemo(
    () => [
      {
        headerName: "Customer Name",
        field: "customerName",
        sortable: true,
        filter: true,
        resizable: true,
        flex: 3,
        cellRenderer: (params) => (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
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
        flex: 1,
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
        flex: 2,
        cellRenderer: (params) => (
          <div className="flex space-x-2">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewPurchases(params.data)}
              className="text-blue-600 hover:text-blue-700"
              disabled={loading}
            >
              <Eye className="h-4 w-4 mr-1" /> Purchases
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewSells(params.data)}
              className="text-green-600 hover:text-green-700"
              disabled={loading}
            >
              <Eye className="h-4 w-4 mr-1" /> Sells
            </Button>
          </div>
        ),
      },
    ],
    [loading]
  );

  const purchaseColumnDefs = useMemo(
    () => [
      {
        headerName: "Invoice",
        field: "invoice",
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
      },
      {
        headerName: "Date",
        field: "createdAt",
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
        valueFormatter: (params) => {
          return formatDate(params.value);
        },
      },
      {
        headerName: "Transport",
        field: "modeOfTransport",
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
      },
      {
        headerName: "Items",
        field: "stockEntries",
        sortable: false,
        filter: false,
        resizable: true,
        flex: 1,
        valueFormatter: (params) => {
          return params.value?.length || 0;
        },
      },
      {
        headerName: "Status",
        field: "status",
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
        cellRenderer: (params) => {
          return (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Completed
            </Badge>
          );
        },
      },
      {
        headerName: "Actions",
        field: "_id",
        sortable: false,
        filter: false,
        resizable: false,
        flex: 1,
        cellRenderer: (params) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewPurchaseDetails(params.data)}
          >
            View Details
          </Button>
        ),
      },
    ],
    []
  );

  const sellColumnDefs = useMemo(
    () => [
      {
        headerName: "Invoice",
        field: "invoice",
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
      },
      {
        headerName: "Date",
        field: "createdAt",
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
        valueFormatter: (params) => {
          return formatDate(params.value);
        },
      },
      {
        headerName: "Transport",
        field: "modeOfTransport",
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
      },
      {
        headerName: "Items",
        field: "stockEntries",
        sortable: false,
        filter: false,
        resizable: true,
        flex: 1,
        valueFormatter: (params) => {
          return params.value?.length || 0;
        },
      },
      {
        headerName: "Status",
        field: "status",
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
        cellRenderer: (params) => {
          return (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Completed
            </Badge>
          );
        },
      },
      {
        headerName: "Actions",
        field: "_id",
        sortable: false,
        filter: false,
        resizable: false,
        flex: 1,
        cellRenderer: (params) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewSellDetails(params.data)}
          >
            View Details
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer information</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportCustomersToExcel}
            variant="outline"
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button
            onClick={() => {
              setSelectedCustomer(null);
              setFormData({ customerName: "" });
              setIsFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search customers..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={loading}>
          Search
        </Button>
      </form>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold">{pagination.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
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
            rowData={customers}
            columnDefs={customerColumnDefs}
            loading={loading}
            pagination={false}
            suppressPaginationPanel={true}
            overlayLoadingTemplate={
              '<div class="ag-overlay-loading-center">Loading customers...</div>'
            }
            overlayNoRowsTemplate={
              '<div class="ag-overlay-loading-center">No customers found</div>'
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
          <div className="flex items-center space-x-2">
            <Label htmlFor="rowsPerPage">Rows per page:</Label>
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => {
                console.log(value);
                handleLimitChange(parseInt(value));
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value={pagination.total.toString()}>All</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

      {/* Customer Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerName: e.target.value,
                  }))
                }
                placeholder="Enter customer name"
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
                  : selectedCustomer
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
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCustomer?.customerName}
              "? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Purchase View Dialog */}
      <Dialog open={isPurchaseViewOpen} onOpenChange={setIsPurchaseViewOpen}>
        <DialogContent className="sm:max-w-[90%] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Purchase History for {selectedCustomer?.customerName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Bar */}
            <form onSubmit={handlePurchaseSearch} className="flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search purchases..."
                  value={purchaseSearch}
                  onChange={(e) => setPurchaseSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading}>
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={exportPurchaseToExcel}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            </form>

            {/* AG Grid Table */}
            <div className="bg-white rounded-lg shadow border">
              <div
                className="ag-theme-alpine"
                style={{ height: "400px", width: "100%" }}
              >
                <AgGridReact
                  rowData={purchaseData}
                  columnDefs={purchaseColumnDefs}
                  loading={loading}
                  pagination={false}
                  suppressPaginationPanel={true}
                  overlayLoadingTemplate={
                    '<div class="ag-overlay-loading-center">Loading purchase data...</div>'
                  }
                  overlayNoRowsTemplate={
                    '<div class="ag-overlay-loading-center">No purchase data found</div>'
                  }
                />
              </div>
            </div>

            {/* Custom Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing{" "}
                {(purchasePagination.page - 1) * purchasePagination.limit + 1}{" "}
                to{" "}
                {Math.min(
                  purchasePagination.page * purchasePagination.limit,
                  purchasePagination.total
                )}{" "}
                of {purchasePagination.total} entries
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="purchaseRowsPerPage">Rows per page:</Label>
                  <Select
                    value={purchasePagination.limit.toString()}
                    onValueChange={(value) =>
                      handlePurchaseLimitChange(parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value={purchasePagination.total.toString()}>
                        All
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePurchasePageChange(purchasePagination.page - 1)
                  }
                  disabled={purchasePagination.page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {purchasePagination.page} of {purchasePagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePurchasePageChange(purchasePagination.page + 1)
                  }
                  disabled={purchasePagination.page >= purchasePagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sell View Dialog */}
      <Dialog open={isSellViewOpen} onOpenChange={setIsSellViewOpen}>
        <DialogContent className="sm:max-w-[90%] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Sell History for {selectedCustomer?.customerName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSellSearch} className="flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search sells..."
                  value={sellSearch}
                  onChange={(e) => setSellSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading}>
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={exportSellToExcel}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            </form>

            {/* AG Grid Table */}
            <div className="bg-white rounded-lg shadow border">
              <div
                className="ag-theme-alpine"
                style={{ height: "400px", width: "100%" }}
              >
                <AgGridReact
                  rowData={sellData}
                  columnDefs={sellColumnDefs}
                  loading={loading}
                  pagination={false}
                  suppressPaginationPanel={true}
                  overlayLoadingTemplate={
                    '<div class="ag-overlay-loading-center">Loading sell data...</div>'
                  }
                  overlayNoRowsTemplate={
                    '<div class="ag-overlay-loading-center">No sell data found</div>'
                  }
                />
              </div>
            </div>

            {/* Custom Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(sellPagination.page - 1) * sellPagination.limit + 1}{" "}
                to{" "}
                {Math.min(
                  sellPagination.page * sellPagination.limit,
                  sellPagination.total
                )}{" "}
                of {sellPagination.total} entries
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="sellRowsPerPage">Rows per page:</Label>
                  <Select
                    value={sellPagination.limit.toString()}
                    onValueChange={(value) =>
                      handleSellLimitChange(parseInt(value))
                    }
                  >
                     <SelectTrigger className="w-20">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value={sellPagination.total.toString()}>
                        All
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSellPageChange(sellPagination.page - 1)}
                  disabled={sellPagination.page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {sellPagination.page} of {sellPagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSellPageChange(sellPagination.page + 1)}
                  disabled={sellPagination.page >= sellPagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase Details Dialog */}
      <Dialog
        open={isPurchaseDetailsOpen}
        onOpenChange={setIsPurchaseDetailsOpen}
      >
        <DialogContent className="sm:max-w-[80%] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Purchase Details - {selectedPurchase?.invoice || "N/A"}
            </DialogTitle>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-4">
              {/* Purchase Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Invoice:</span>
                  <span className="text-sm">
                    {selectedPurchase.invoice || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Date:</span>
                  <span className="text-sm">
                    {formatDate(selectedPurchase.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Transport:</span>
                  <span className="text-sm">
                    {selectedPurchase.modeOfTransport}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Customer:</span>
                  <span className="text-sm">
                    {selectedPurchase.customerId?.customerName || "N/A"}
                  </span>
                </div>
              </div>

              {/* Remark */}
              {selectedPurchase.remark && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Remark
                  </h4>
                  <p className="text-sm text-blue-700">
                    {selectedPurchase.remark}
                  </p>
                </div>
              )}

              {/* Stock Entries Table */}
              <div className="border rounded-md overflow-hidden">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Godown
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedPurchase.stockEntries?.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.categoryId?.categoryName || "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.productId?.productName || "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.godownId?.godownName || "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sell Details Dialog */}
      <Dialog open={isSellDetailsOpen} onOpenChange={setIsSellDetailsOpen}>
        <DialogContent className="sm:max-w-[80%] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Sell Details - {selectedSell?.invoice || "N/A"}
            </DialogTitle>
          </DialogHeader>

          {selectedSell && (
            <div className="space-y-4">
              {/* Sell Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Invoice:</span>
                  <span className="text-sm">
                    {selectedSell.invoice || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Date:</span>
                  <span className="text-sm">
                    {formatDate(selectedSell.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Transport:</span>
                  <span className="text-sm">
                    {selectedSell.modeOfTransport}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Customer:</span>
                  <span className="text-sm">
                    {selectedSell.customerId?.customerName || "N/A"}
                  </span>
                </div>
              </div>

              {/* Remark */}
              {selectedSell.remark && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Remark
                  </h4>
                  <p className="text-sm text-blue-700">{selectedSell.remark}</p>
                </div>
              )}

              {/* Stock Entries Table */}
              <div className="border rounded-md overflow-hidden">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Godown
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedSell.stockEntries?.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.categoryId?.categoryName || "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.productId?.productName || "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.godownId?.godownName || "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
