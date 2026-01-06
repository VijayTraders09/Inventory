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
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import SearchableSelect from "@/components/ui/searchable-select";

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
  
export default function PurchaseReturnGrid() {
  // Local state
  const [purchaseReturn, setPurchaseReturn] = useState([]); // Changed from 'purchase-return' to 'purchaseReturn' for consistency
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
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
      stockAvailable: 0,
      isStockSufficient: true,
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
  const [stockCheckLoading, setStockCheckLoading] = useState({});

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


  // Fetch purchaseReturn
  const fetchPurchaseReturns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        search,
      });

      const response = await axios.get(`/api/purchase-return?${params}`);

      if (response.data.success) {
        setPurchaseReturn(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.data.error || "Failed to fetch purchaseReturn");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "An error occurred while fetching purchaseReturn"
      );
    } finally {
      setLoading(false);
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
    fetchPurchaseReturns();
    fetchDropdownData();
  }, [currentPage, search, pagination.limit]);

  const handleView = (sale) => {
    setSelectedSale(sale);
    setIsViewOpen(true);
  };

  const handleEdit = (sale) => {
    setSelectedSale(sale);
    setFormData({
      customerId: sale.customerId._id,
      invoice: sale.invoice || "",
      modeOfTransport: sale.modeOfTransport,
      remark: sale.remark || "",
      stockEntries
    });

    // Populate stock entries from the sale
    const entries = sale.stockEntries.map((entry) => {
      // Handle both populated and non-populated entries
      const categoryId = entry.categoryId._id || entry.categoryId;
      const productId = entry.productId._id || entry.productId;
      const godownId = entry.godownId._id || entry.godownId;
      
      return {
        _id: entry._id,
        categoryId: categoryId,
        productId: productId,
        godownId: godownId,
        quantity: entry.quantity,
        stockAvailable: 0,
        isStockSufficient: true,
        isValid: true,
        errors: {
          categoryId: "",
          productId: "",
          godownId: "",
          quantity: "",
        },
      };
    });

    setStockEntries(entries);

    // Fetch products for each stock entry
    // entries.forEach((entry, index) => {
    //   if (entry.categoryId) {
    //     // fetchProductsByCategory(entry.categoryId, index);
    //     // Check stock availability for each entry
    //     checkStockAvailability(entry.productId, entry.godownId, entry.quantity, index);
    //   }
    // });

    setIsFormOpen(true);
  };

  const handleDelete = (sale) => {
    setSelectedSale(sale);
    setIsDeleteOpen(true);
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
        stockAvailable: 0,
        isStockSufficient: true,
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
      newEntries[index].stockAvailable = 0;
      newEntries[index].isStockSufficient = true;
      fetchProductsByCategory(value, index);
    }

    // Validate the entry
    const validation = validateStockEntry(newEntries[index]);
    newEntries[index].isValid = validation.isValid;
    newEntries[index].errors = validation.errors;

    // Check stock availability when product, godown, or quantity changes
    if (
      (field === "productId" || field === "godownId" || field === "quantity") &&
      newEntries[index].productId &&
      newEntries[index].godownId &&
      newEntries[index].quantity
    ) {
    //   checkStockAvailability(
    //     newEntries[index].productId,
    //     newEntries[index].godownId,
    //     newEntries[index].quantity,
    //     index
    //   );
    }

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
    
    // Check if all stock entries have sufficient stock
    const hasInsufficientStock = stockEntries.some(
      (entry) => !entry.isStockSufficient
    );
    
    if (hasInsufficientStock) {
      toast.error("Some items have insufficient stock. Please adjust quantities.");
      return;
    }

    setIsSubmitting(true);

    try {
      const saleData = {
        ...formData,
        stockEntries,
      };

      let response;
      if (selectedSale) {
        response = await axios.put(
          `/api/purchase-return/${selectedSale._id}`,
          saleData
        );
      } else {
        response = await axios.post("/api/purchase-return", saleData);
      }

      if (response.data.success) {
        toast.success(
          response.data.message ||
            (selectedSale
              ? "Purchase Return updated successfully"
              : "Purchase Return created successfully")
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
            stockAvailable: 0,
            isStockSufficient: true,
            isValid: false,
            errors: {
              categoryId: "",
              productId: "",
              godownId: "",
              quantity: "",
            },
          },
        ]);
        setSelectedSale(null);
        fetchPurchaseReturns(); // Refresh purchaseReturn list
      } else {
        toast.error(response.data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSale = async () => {
    if (!selectedSale) return;

    try {
      const response = await axios.delete(
        `/api/purchase-return/${selectedSale._id}`
      );

      if (response.data.success) {
        toast.success("Purchase Return deleted successfully");
        setIsDeleteOpen(false);
        setSelectedSale(null);
        fetchPurchaseReturns(); // Refresh purchaseReturn list
      } else {
        toast.error(response.data.error || "Failed to delete sale");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete sale");
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
        width: 200,
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Return</h1>
          <p className="text-gray-600 mt-1">Manage your purchaseReturn records</p>
        </div>
        <Button
          onClick={() => {
            setSelectedSale(null);
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
                stockAvailable: 0,
                isStockSufficient: true,
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
          <Plus className="mr-2 h-4 w-4" /> Add Purchase Return
        </Button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search purchaseReturn by invoice..."
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
              <p className="text-sm text-gray-600">Total Purchase Return</p>
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
                {purchaseReturn.reduce(
                  (sum, sale) => sum + sale.totalQuantity,
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
            rowData={purchaseReturn}
            columnDefs={columnDefs}
            loading={loading}
            pagination={false}
            suppressPaginationPanel={true}
            overlayLoadingTemplate={
              '<div class="ag-overlay-loading-center">Loading purchaseReturn...</div>'
            }
            overlayNoRowsTemplate={
              '<div class="ag-overlay-loading-center">No purchaseReturn found</div>'
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

      {/* Purchase Return Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSale ? "Edit Purchase Return" : "Add New Purchase Return"}
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
                    !entry.isValid || !entry.isStockSufficient ? "border-red-300 bg-red-50" : ""
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
                      <div className="relative">
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
                          className={
                            !entry.isStockSufficient || entry.errors.quantity ? "border-red-500" : ""
                          }
                        />
                        {stockCheckLoading[index] && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          </div>
                        )}
                      </div>
                      {entry.errors.quantity && (
                        <p className="text-sm text-red-500">{entry.errors.quantity}</p>
                      )}
                    </div>
                  </div>

                  {/* Stock Availability Indicator */}
                  {/* {entry.productId && entry.godownId && entry.quantity && (
                    <div className="flex items-center gap-2 text-sm">
                      {entry.isStockSufficient ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Package className="h-4 w-4" />
                          <span>
                            Stock available: {entry.stockAvailable || 0}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>
                            Insufficient stock. Available: {entry.stockAvailable || 0}, 
                            Required: {entry.quantity}, 
                            Shortage: {entry.shortage || 0}
                          </span>
                        </div>
                      )}
                    </div>
                  )} */}
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
                disabled={isSubmitting || stockEntries.some(entry => !entry.isStockSufficient || !entry.isValid)}
              >
                {isSubmitting
                  ? "Saving..."
                  : selectedSale
                  ? "Update"
                  : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Purchase Return Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Return Details</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">
                    {selectedSale.customerId.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Invoice</p>
                  <p className="font-medium">
                    {selectedSale.invoice || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mode of Transport</p>
                  <p className="font-medium">
                    {selectedSale.modeOfTransport}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Quantity</p>
                  <p className="font-medium">
                    {selectedSale.totalQuantity}
                  </p>
                </div>
              </div>

              {selectedSale.remark && (
                <div>
                  <p className="text-sm text-gray-600">Remark</p>
                  <p className="font-medium">{selectedSale.remark}</p>
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
                      {selectedSale.stockEntries.map((entry, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm">
                            {entry.categoryId.categoryName || entry.categoryId}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {entry.productId.productName || entry.productId}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {entry.godownId.godownName || entry.godownId}
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
            <AlertDialogTitle>Delete Purchase Return</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sale? This will also
              restore all associated stock entries and update product quantities.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSale}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}