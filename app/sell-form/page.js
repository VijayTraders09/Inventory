"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  X,
  AlertCircle,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import SearchableSelect from "@/components/ui/searchable-select";

export default function SalesForm() {
  // Local state
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [godowns, setGodowns] = useState([]);
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

  // Function to check stock availability
  const checkStockAvailability = async (productId, godownId, quantity, index) => {
    if (!productId || !godownId || !quantity) return;

    // Set loading state for this specific entry
    setStockCheckLoading(prev => ({ ...prev, [index]: true }));

    try {
      const response = await axios.get(
        `/api/stocks/check?productId=${productId}&godownId=${godownId}&quantity=${quantity}`
      );

      if (response.data.success) {
        const { available, availableQuantity, shortage } = response.data.data;
        
        // Update the stock entry with stock availability info
        const newEntries = [...stockEntries];
        newEntries[index].stockAvailable = availableQuantity;
        newEntries[index].isStockSufficient = available;
        newEntries[index].shortage = shortage;
        setStockEntries(newEntries);

        // Show warning if stock is insufficient
        if (!available) {
          toast.error(
            `Insufficient stock. Available: ${availableQuantity}, Required: ${quantity}, Shortage: ${shortage}`
          );
        }
      } else {
        toast.error(response.data.error || "Failed to check stock availability");
      }
    } catch (error) {
      console.error("Error checking stock availability:", error);
      toast.error("Error checking stock availability");
    } finally {
      // Clear loading state for this specific entry
      setStockCheckLoading(prev => ({ ...prev, [index]: false }));
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
    fetchDropdownData();
  }, []);

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
      checkStockAvailability(
        newEntries[index].productId,
        newEntries[index].godownId,
        newEntries[index].quantity,
        index
      );
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

      const response = await axios.post("/api/sell", saleData);

      if (response.data.success) {
        toast.success("Sale created successfully");
        // Reset form
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
      } else {
        toast.error(response.data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 p-4 bg-gray-50 min-h-screen max-w-[90%] m-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Sale</h1>
          <p className="text-lg text-gray-600 mt-1">Record a new sale and update inventory</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-8 max-h-[80vh] overflow-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="customerId" className="text-lg font-medium text-gray-700">Customer *</label>
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
              <label htmlFor="invoice" className="text-lg font-medium text-gray-700">Invoice</label>
              <Input
                id="invoice"
                value={formData.invoice}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, invoice: e.target.value }))
                }
                placeholder="Enter invoice number"
                className="text-lg p-3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="modeOfTransport" className="text-lg font-medium text-gray-700">Mode of Transport *</label>
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
              className="text-lg p-3"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="remark" className="text-lg font-medium text-gray-700">Remark</label>
            <Textarea
              id="remark"
              value={formData.remark}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, remark: e.target.value }))
              }
              placeholder="Enter remark (optional)"
              rows={3}
              className="text-lg p-3"
            />
          </div>

          {/* Stock Entries */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Stock Entries</h2>
            </div>

            {stockEntries.map((entry, index) => (
              <div 
                key={index} 
                className={`border rounded-lg p-6 space-y-4 ${
                  !entry.isValid || !entry.isStockSufficient ? "border-red-300 bg-red-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Entry #{index + 1}</h3>
                  {stockEntries.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveStockEntry(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-base font-medium text-gray-700">Category *</label>
                    <Select
                      value={entry.categoryId}
                      onValueChange={(value) =>
                        handleStockEntryChange(index, "categoryId", value)
                      }
                    >
                      <SelectTrigger className={`text-base p-3 ${entry.errors.categoryId ? "border-red-500" : ""}`}>
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
                    <label className="text-base font-medium text-gray-700">Product *</label>
                    <Select
                      value={entry.productId}
                      onValueChange={(value) =>
                        handleStockEntryChange(index, "productId", value)
                      }
                      disabled={!entry.categoryId}
                    >
                      <SelectTrigger className={`text-base p-3 ${entry.errors.productId ? "border-red-500" : ""}`}>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {(products[index] || []).map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.productName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {entry.errors.productId && (
                      <p className="text-sm text-red-500">{entry.errors.productId}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-base font-medium text-gray-700">Godown *</label>
                    <Select
                      value={entry.godownId}
                      onValueChange={(value) =>
                        handleStockEntryChange(index, "godownId", value)
                      }
                    >
                      <SelectTrigger className={`text-base p-3 ${entry.errors.godownId ? "border-red-500" : ""}`}>
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
                    <label className="text-base font-medium text-gray-700">Quantity *</label>
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
                        className={`text-lg p-3 ${entry.errors.quantity ? "border-red-500" : ""}`}
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
                {entry.productId && entry.godownId && entry.quantity && (
                  <div className="flex items-center gap-2 text-sm mt-2">
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
                )}
              </div>
            ))}
            <div className="flex items-center justify-end mt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={handleAddStockEntry}
              >
                <Plus className="h-5 w-5 mr-2" /> Add Entry
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="text-lg px-6 py-3"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="lg"
              className="text-lg px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting || stockEntries.some(entry => !entry.isValid || !entry.isStockSufficient)}
            >
              {isSubmitting ? "Saving..." : "Create Sale"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}