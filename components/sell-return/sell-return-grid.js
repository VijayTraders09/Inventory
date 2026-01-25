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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ShoppingCart,
  Package,
  Building,
  User,
  X,
  AlertCircle,
  Printer,
  Download, // Added this import
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import SearchableSelect from "@/components/ui/searchable-select";
import * as XLSX from "xlsx"; // Added this import

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

const ProductSearchableSelect = ({
  value,
  onChange,
  products,
  disabled,
  className,
  placeholder,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products || [];

    return products.filter((product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const selectedProduct = useMemo(() => {
    if (!value || !products) return null;
    return products.find((product) => product._id === value);
  }, [value, products]);

  return (
    <div className="relative">
      <div
        className={`flex  h-9 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedProduct ? selectedProduct.productName : placeholder}
      </div>

      {isOpen && !disabled && (
        <div className="absolute bottom-0 z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2">
            <input
              type="text"
              className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="py-1">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <li
                  key={product._id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    onChange(product._id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  {product.productName}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-500">No products found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default function SellReturnGrid() {
  // Local state
  const [sells, setSells] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false); // Added for export functionality
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedSellReturnPrint, setSelectedSellReturnPrint] = useState(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    invoice: "",
    modeOfTransport: "",
    remark: "",
  });
  const [stockEntries, setStockEntries] = useState([
    {
      categoryId: "",
      productId: "",
      godownId: "",
      quantity: 1,
      isValid: false,
      errors: {
        categoryId: "",
        productId: "",
        godownId: "",
        quantity: "",
      },
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  // Function to validate a stock entry
  const validateStockEntry = (entry) => {
    const errors = {
      categoryId: "",
      productId: "",
      godownId: "",
      quantity: "",
    };
    let isValid = true;

    if (!entry.categoryId) {
      errors.categoryId = "Category is required";
      isValid = false;
    }

    if (!entry.productId) {
      errors.productId = "Product is required";
      isValid = false;
    }

    if (!entry.godownId) {
      errors.godownId = "Godown is required";
      isValid = false;
    }

    if (!entry.quantity || entry.quantity <= 0) {
      errors.quantity = "Quantity must be greater than 0";
      isValid = false;
    }

    return { isValid, errors };
  };

  // Fetch sells
  const fetchSellReturn = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        search,
      });

      const response = await axios.get(`/api/sell-return?${params}`);

      if (response.data.success) {
        setSells(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.data.error || "Failed to fetch sells");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "An error occurred while fetching sells"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch all sell returns for export
  const fetchAllSellReturns = async () => {
    try {
      const response = await axios.get(`/api/sell-return?limit=${pagination.total}`);
      if (response.data.success) {
        return response.data.data;
      } else {
        toast.error(
          response.data.error || "Failed to fetch sell returns for export"
        );
        return [];
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "An error occurred while fetching sell returns for export"
      );
      return [];
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    setExporting(true);
    try {
      const allSellReturns = await fetchAllSellReturns();

      if (allSellReturns.length === 0) {
        toast.error("No data to export");
        setExporting(false);
        return;
      }

      // Prepare data for Excel with product details
      const excelData = [];
      let serialNumber = 1;

      allSellReturns.forEach((sellReturn) => {
        // Add a header row for the sell return
        excelData.push({
          "S.No": serialNumber++,
          Customer: sellReturn.customerId?.customerName || "N/A",
          Invoice: sellReturn.invoice || "N/A",
          "Total Quantity": sellReturn.totalQuantity,
          "Mode of Transport": sellReturn.modeOfTransport,
          "Created Date": new Date(sellReturn.createdAt).toLocaleDateString(),
          Remark: sellReturn.remark || "N/A",
          "Product Name": "",
          "Category Name": "",
          "Product Quantity": "",
          Godown: "",
        });

        // Add rows for each product in the sell return
        sellReturn.stockEntries.forEach((entry, index) => {
          excelData.push({
            "S.No": "",
            Customer: "",
            Invoice: "",
            "Total Quantity": "",
            "Mode of Transport": "",
            "Created Date": "",
            Remark: "",
            "Product Name": entry.productId?.productName || entry.productId || "N/A",
            "Category Name": entry.categoryId?.categoryName || entry.categoryId || "N/A",
            "Product Quantity": entry.quantity,
            Godown: entry.godownId?.godownName || entry.godownId || "N/A",
          });
        });
      });

      // Create a workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 5 }, // S.No
        { wch: 20 }, // Customer
        { wch: 15 }, // Invoice
        { wch: 12 }, // Total Quantity
        { wch: 15 }, // Mode of Transport
        { wch: 12 }, // Created Date
        { wch: 20 }, // Remark
        { wch: 25 }, // Product Name
        { wch: 20 }, // Category Name
        { wch: 12 }, // Product Quantity
        { wch: 15 }, // Godown
        { wch: 15 }, // Row Type
      ];
      ws["!cols"] = colWidths;

      // Add styling to differentiate header rows from product rows
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const rowType = ws[XLSX.utils.encode_cell({ c: 11, r: R })]?.v; // Row Type column
        if (rowType === "Sell Return Header") {
          // Make header rows bold
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
            if (!ws[cellAddress]) continue;
            ws[cellAddress].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: "FFFFAA00" } }, // Light yellow background
            };
          }
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Sell Returns");

      // Generate buffer
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

      // Create blob
      const blob = new Blob([wbout], { type: "application/octet-stream" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sell_returns_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Sell returns exported successfully with product details");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export sell returns");
    } finally {
      setExporting(false);
    }
  };

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const [categoriesRes, godownsRes] = await Promise.all([
        axios.get("/api/categories?limit=10000"),
        axios.get("/api/godown?limit=100"),
      ]);

      if (categoriesRes.data.success) setCategories(categoriesRes.data.data);
      if (godownsRes.data.success) setGodowns(godownsRes.data.data);
    } catch (error) {
      toast.error("Failed to fetch dropdown data");
    }
  };

  // Fetch products by category
  const fetchProductsByCategory = async (categoryId, index) => {
    if (!categoryId) return;

    try {
      const response = await axios.get(
        `/api/products/by-category?categoryId=${categoryId}`
      );

      if (response.data.success) {
        const newProducts = [...products];
        newProducts[index] = response.data.data;
        setProducts(newProducts);
      }
    } catch (error) {
      toast.error("Failed to fetch products");
    }
  };

  useEffect(() => {
    fetchSellReturn();
    fetchDropdownData();
  }, [currentPage, search, pagination.limit]);

  const handleView = (sell) => {
    setSelectedPurchase(sell);
    setIsViewOpen(true);
  };

  const handleEdit = (sell) => {
    setSelectedPurchase(sell);
    setFormData({
      customerId: sell.customerId._id,
      invoice: sell.invoice || "",
      modeOfTransport: sell.modeOfTransport,
      remark: sell.remark || "",
    });

    // Populate stock entries from the sell
    const entries = sell.stockEntries.map((entry) => ({
      _id: entry._id,
      categoryId: entry.categoryId._id,
      productId: entry.productId._id,
      godownId: entry.godownId._id,
      quantity: entry.quantity,
      isValid: true,
      errors: {
        categoryId: "",
        productId: "",
        godownId: "",
        quantity: "",
      },
    }));

    setStockEntries(entries);

    // Fetch products for each stock entry
    entries.forEach((entry, index) => {
      if (entry.categoryId) {
        fetchProductsByCategory(entry.categoryId, index);
      }
    });

    setIsFormOpen(true);
  };

  const handleDelete = (sell) => {
    setSelectedPurchase(sell);
    setIsDeleteOpen(true);
  };

  const handlePrint = (sell) => {
    setSelectedSellReturnPrint(sell);
    setShowBillPreview(true);
  };

  const handlePrintBill = () => {
    setIsPrinting(true);
    setShowBillPreview(false);

    // Add a small delay to ensure the print content is rendered
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 1000);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(localSearch);
    setCurrentPage(1);
  };

  const handleLimitChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, limit: newLimit }));
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const handleAddStockEntry = () => {
    setStockEntries([
      ...stockEntries,
      {
        categoryId: "",
        productId: "",
        godownId: "",
        quantity: 1,
        isValid: false,
        errors: {
          categoryId: "",
          productId: "",
          godownId: "",
          quantity: "",
        },
      },
    ]);
  };

  const handleRemoveStockEntry = (index) => {
    const newEntries = [...stockEntries];
    newEntries.splice(index, 1);
    setStockEntries(newEntries);

    // Also remove products for this entry
    const newProducts = [...products];
    newProducts.splice(index, 1);
    setProducts(newProducts);
  };

  const handleStockEntryChange = (index, field, value) => {
    const newEntries = [...stockEntries];
    newEntries[index][field] = value;

    // Reset product and godown if category changes
    if (field === "categoryId") {
      newEntries[index].productId = "";
      newEntries[index].godownId = "";
      fetchProductsByCategory(value, index);
    }

    // Validate the entry
    const validation = validateStockEntry(newEntries[index]);
    newEntries[index].isValid = validation.isValid;
    newEntries[index].errors = validation.errors;

    setStockEntries(newEntries);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all stock entries
    let hasInvalidEntries = false;
    const updatedEntries = stockEntries.map((entry) => {
      const validation = validateStockEntry(entry);
      if (!validation.isValid) {
        hasInvalidEntries = true;
      }
      return {
        ...entry,
        isValid: validation.isValid,
        errors: validation.errors,
      };
    });
    
    if (hasInvalidEntries) {
      setStockEntries(updatedEntries);
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setIsSubmitting(true);

    try {
      const purchaseData = {
        ...formData,
        stockEntries,
      };

      let response;
      if (selectedPurchase) {
        response = await axios.put(
          `/api/sell-return/${selectedPurchase._id}`,
          purchaseData
        );
      } else {
        response = await axios.post("/api/sell-return", purchaseData);
      }

      if (response.data.success) {
        toast.success(
          response.data.message ||
            (selectedPurchase
              ? "Sell updated successfully"
              : "Sell created successfully")
        );
        setIsFormOpen(false);
        setFormData({
          customerId: "",
          invoice: "",
          modeOfTransport: "",
          remark: "",
        });
        setStockEntries([
          {
            categoryId: "",
            productId: "",
            godownId: "",
            quantity: 1,
            isValid: false,
            errors: {
              categoryId: "",
              productId: "",
              godownId: "",
              quantity: "",
            },
          },
        ]);
        setSelectedPurchase(null);
        fetchSellReturn(); // Refresh sells list
      } else {
        toast.error(response.data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePurchase = async () => {
    if (!selectedPurchase) return;

    try {
      const response = await axios.delete(
        `/api/sell-return/${selectedPurchase._id}`
      );

      if (response.data.success) {
        toast.success("Sell deleted successfully");
        setIsDeleteOpen(false);
        setSelectedPurchase(null);
        fetchSellReturn(); // Refresh sells list
      } else {
        toast.error(response.data.error || "Failed to delete sell");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete sell");
    }
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Customer",
        field: "customerId.customerName",
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
        cellRenderer: (params) => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{params.value}</span>
          </div>
        ),
      },
      {
        headerName: "Invoice",
        field: "invoice",
        sortable: true,
        filter: true,
        resizable: true,
        width: 120,
        cellRenderer: (params) => <span>{params.value || "N/A"}</span>,
      },
      {
        headerName: "Total Quantity",
        field: "totalQuantity",
        sortable: true,
        filter: true,
        resizable: true,
        width: 120,
        cellRenderer: (params) => (
          <Badge variant="outline">{params.value}</Badge>
        ),
      },
      {
        headerName: "Mode of Transport",
        field: "modeOfTransport",
        sortable: true,
        filter: true,
        resizable: true,
        width: 150,
      },
      {
        headerName: "Created Date",
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
        width: 250,
        cellRenderer: (params) => (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleView(params.data)}
              disabled={loading}
            >
              View
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
              onClick={() => handlePrint(params.data)}
              disabled={loading}
            >
              <Printer className="h-4 w-4" />
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
    [loading]
  );

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sell Returns</h1>
            <p className="text-gray-600 mt-1">Manage your sell return records</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={exportToExcel}
              variant="outline"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={loading || exporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? "Exporting..." : "Export Excel"}
            </Button>
            {/* <Button
              onClick={() => {
                setSelectedPurchase(null);
                setFormData({
                  customerId: "",
                  invoice: "",
                  modeOfTransport: "",
                  remark: "",
                });
                setStockEntries([
                  {
                    categoryId: "",
                    productId: "",
                    godownId: "",
                    quantity: 1,
                    isValid: false,
                    errors: {
                      categoryId: "",
                      productId: "",
                      godownId: "",
                      quantity: "",
                    },
                  },
                ]);
                setIsFormOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Sell Return
            </Button> */}
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search sell returns by invoice..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Records Per Page Dropdown */}
          <div className="flex items-center gap-2">
            <Label htmlFor="recordsPerPage" className="text-sm whitespace-nowrap">
              Records per page:
            </Label>
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => handleLimitChange(parseInt(value))}
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
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" disabled={loading}>
            Search
          </Button>
        </form>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sell Returns</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">
                  {sells.reduce(
                    (sum, sell) => sum + sell.totalQuantity,
                    0
                  )}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
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
              rowData={sells}
              columnDefs={columnDefs}
              loading={loading}
              pagination={false}
              suppressPaginationPanel={true}
              overlayLoadingTemplate={
                '<div class="ag-overlay-loading-center">Loading sell returns...</div>'
              }
              overlayNoRowsTemplate={
                '<div class="ag-overlay-loading-center">No sell returns found</div>'
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

        {/* Sell Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPurchase ? "Edit Sell Return" : "Add New Sell Return"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer *</Label>
                  <SearchableSelect
                    value={formData.customerId}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, customerId: value }))
                    }
                    searchEndpoint="/api/customer"
                    labelField="customerName"
                    valueField="_id"
                    placeholder="Select a customer"
                    minSearchLength={1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice">Invoice</Label>
                  <Input
                    id="invoice"
                    value={formData.invoice}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, invoice: e.target.value }))
                    }
                    placeholder="Enter invoice number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modeOfTransport">Mode of Transport *</Label>
                <Input
                  id="modeOfTransport"
                  value={formData.modeOfTransport}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      modeOfTransport: e.target.value,
                    }))
                  }
                  placeholder="Enter mode of transport"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remark">Remark</Label>
                <Textarea
                  id="remark"
                  value={formData.remark}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, remark: e.target.value }))
                  }
                  placeholder="Enter remark (optional)"
                  rows={2}
                />
              </div>

              {/* Stock Entries */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Stock Entries</Label>
                </div>

                {stockEntries.map((entry, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-lg p-4 space-y-4 ${
                      !entry.isValid ? "border-red-300 bg-red-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Entry #{index + 1}</h3>
                      {stockEntries.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveStockEntry(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select
                          value={entry.categoryId}
                          onValueChange={(value) =>
                            handleStockEntryChange(index, "categoryId", value)
                          }
                        >
                          <SelectTrigger className={entry.errors.categoryId ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category._id} value={category._id}>
                                {category.categoryName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {entry.errors.categoryId && (
                          <p className="text-sm text-red-500">{entry.errors.categoryId}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Product *</Label>
                        <ProductSearchableSelect
                          value={entry.productId}
                          onChange={(value) =>
                            handleStockEntryChange(index, "productId", value)
                          }
                          products={products[index] || []}
                          disabled={!entry.categoryId}
                          className={
                            entry.errors.productId ? "border-red-500" : ""
                          }
                          placeholder="Select product"
                        />
                        {entry.errors.productId && (
                          <p className="text-sm text-red-500">{entry.errors.productId}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Godown *</Label>
                        <Select
                          value={entry.godownId}
                          onValueChange={(value) =>
                            handleStockEntryChange(index, "godownId", value)
                          }
                        >
                          <SelectTrigger className={entry.errors.godownId ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select godown" />
                          </SelectTrigger>
                          <SelectContent>
                            {godowns.map((godown) => (
                              <SelectItem key={godown._id} value={godown._id}>
                                {godown.godownName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {entry.errors.godownId && (
                          <p className="text-sm text-red-500">{entry.errors.godownId}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={entry.quantity}
                          onChange={(e) =>
                            handleStockEntryChange(
                              index,
                              "quantity",
                              parseInt(e.target.value) 
                            )
                          }
                          placeholder="Quantity"
                          required
                          className={entry.errors.quantity ? "border-red-500" : ""}
                        />
                        {entry.errors.quantity && (
                          <p className="text-sm text-red-500">{entry.errors.quantity}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-green-500"
                    onClick={handleAddStockEntry}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Entry
                  </Button>
                </div>
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
                <Button 
                  type="submit" 
                  disabled={isSubmitting || stockEntries.some(entry => !entry.isValid)}
                >
                  {isSubmitting
                    ? "Saving..."
                    : selectedPurchase
                    ? "Update"
                    : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Sell Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sell Return Details</DialogTitle>
            </DialogHeader>
            {selectedPurchase && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium">
                      {selectedPurchase.customerId.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Invoice</p>
                    <p className="font-medium">
                      {selectedPurchase.invoice || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mode of Transport</p>
                    <p className="font-medium">
                      {selectedPurchase.modeOfTransport}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Quantity</p>
                    <p className="font-medium">
                      {selectedPurchase.totalQuantity}
                    </p>
                  </div>
                </div>

                {selectedPurchase.remark && (
                  <div>
                    <p className="text-sm text-gray-600">Remark</p>
                    <p className="font-medium">{selectedPurchase.remark}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-2">Stock Entries</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">
                            Category
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">
                            Product
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">
                            Godown
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedPurchase.stockEntries.map((entry, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">
                              {entry.categoryId.categoryName}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {entry.productId.productName}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {entry.godownId.godownName}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {entry.quantity}
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
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Sell Return</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this sell return? This will also
                remove all associated stock entries and update product quantities.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePurchase}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bill Preview Dialog */}
        <Dialog open={showBillPreview} onOpenChange={setShowBillPreview}>
          <DialogContent className="sm:max-w-[400px] max-h-screen overflow-auto">
            <DialogHeader>
              <DialogTitle>Sell Return Bill Preview</DialogTitle>
            </DialogHeader>
            {selectedSellReturnPrint && (
              <div className="space-y-4">
                <div
                  className="bg-white p-4 rounded-lg border"
                  style={{ fontFamily: "monospace", fontSize: "12px" }}
                >
                  <div className="text-center mb-4">
                    <div className="font-bold text-lg mb-2">SELL RETURN BILL</div>
                    <div>Company Name</div>
                    <div>Address Line 1</div>
                    <div>Address Line 2</div>
                    <div>Phone: 1234567890</div>
                    <div className="border-t border-b border-gray-300 mt-2 mb-2 py-1">
                      ------------------------------------------
                    </div>
                  </div>

                  <div className="mb-4">
                    <div>Bill No: {selectedSellReturnPrint.invoice || "N/A"}</div>
                    <div>
                      Date:{" "}
                      {new Date(
                        selectedSellReturnPrint.createdAt
                      ).toLocaleDateString()}
                    </div>
                    <div>
                      Customer: {selectedSellReturnPrint.customerId.customerName}
                    </div>
                    <div>
                      Transport: {selectedSellReturnPrint.modeOfTransport}
                    </div>
                    <div className="border-b border-gray-300 mt-2 mb-2">
                      ------------------------------------------
                    </div>
                  </div>

                  <div className="mb-4">
                    <table
                      className="w-full"
                      style={{ borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              border: "1px solid #000",
                              padding: "3px",
                              textAlign: "left",
                              fontSize: "10px",
                            }}
                          >
                            Item
                          </th>
                          <th
                            style={{
                              border: "1px solid #000",
                              padding: "3px",
                              textAlign: "left",
                              fontSize: "10px",
                            }}
                          >
                            Qty
                          </th>
                          <th
                            style={{
                              border: "1px solid #000",
                              padding: "3px",
                              textAlign: "left",
                              fontSize: "10px",
                            }}
                          >
                            Godown
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSellReturnPrint.stockEntries.map(
                          (entry, index) => (
                            <tr key={index}>
                              <td
                                style={{
                                  border: "1px solid #000",
                                  padding: "3px",
                                  fontSize: "9px",
                                }}
                              >
                                {entry.productId.productName}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #000",
                                  padding: "3px",
                                  fontSize: "9px",
                                }}
                              >
                                {entry.quantity}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #000",
                                  padding: "3px",
                                  fontSize: "9px",
                                }}
                              >
                                {entry.godownId.godownName}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-center">
                    <div className="border-t border-b border-gray-300 mt-2 mb-2 py-1">
                      ------------------------------------------
                    </div>
                    <div>
                      Total Items: {selectedSellReturnPrint.totalQuantity}
                    </div>
                    <div className="border-t border-gray-300 mt-2 mb-2 py-1">
                      ------------------------------------------
                    </div>
                    <div>Thank you for your business!</div>
                    {selectedSellReturnPrint.remark && (
                      <div className="mt-2">
                        Remark: {selectedSellReturnPrint.remark}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowBillPreview(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handlePrintBill}
                    disabled={!selectedSellReturnPrint}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Print Component - Only rendered when printing */}
      {isPrinting && selectedSellReturnPrint && (
        <div className="print-container">
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-container, .print-container * {
                visibility: visible;
              }
              .print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              @page {
                size: 80mm auto;
                margin: 5mm;
              }
              .bill-content {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                font-weight:bold
                width: 80mm;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                padding: 10px;
              }
              .bill-header {
                text-align: center;
                margin-bottom: 10px;
              }
              .bill-title {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 5px;
              }
              .bill-info {
                margin-bottom: 10px;
                 font-weight: bold;
                font-size: 12px;
              }
              .bill-table {
                width: 80mm;
                border-collapse: collapse;
                margin-bottom: 10px;
              }
              .bill-table th, .bill-table td {
                border: 1px solid #000;
                padding: 3px;
                text-align: left;
                font-size: 12px;
                font-weight: bold;
              }
              .bill-table th {
                font-weight: bold;
              }
              .bill-footer {
                margin-top: 10px;
                text-align: center;
                 font-weight: bold;
                font-size: 12px;
              }
            }
          `}</style>
          <div className="bill-content">
            <div className="bill-header">
              <div className="bill-title">SELL RETURN BILL</div>
              {/* <div>Company Name</div>
              <div>Address Line 1</div>
              <div>Address Line 2</div>
              <div>Phone: 1234567890</div>
              <div>------------------------------------------</div> */}
            </div>

            <div className="bill-info">
              <div>Bill No: {selectedSellReturnPrint.invoice || "N/A"}</div>
              <div>
                Date:{" "}
                {new Date(selectedSellReturnPrint.createdAt).toLocaleDateString()}
              </div>
              <div>
                Customer: {selectedSellReturnPrint.customerId.customerName}
              </div>
              <div>Transport: {selectedSellReturnPrint.modeOfTransport}</div>
              <div>------------------------------------------</div>
            </div>

            <table className="bill-table">
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>Item</th>
                  <th style={{ width: "20%" }}>Qty</th>
                  <th style={{ width: "40%" }}>Godown</th>
                </tr>
              </thead>
              <tbody>
                {selectedSellReturnPrint.stockEntries.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.productId.productName}</td>
                    <td>{entry.quantity}</td>
                    <td>{entry.godownId.godownName}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bill-footer">
              <div>------------------------------------------</div>
              <div>Total Items: {selectedSellReturnPrint.totalQuantity}</div>
              <div>------------------------------------------</div>
              <div>Thank you for your business!</div>
              {selectedSellReturnPrint.remark && (
                <div>Remark: {selectedSellReturnPrint.remark}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}