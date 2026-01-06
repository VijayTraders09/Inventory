"use client";

import { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
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
        className={`flex h-9 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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

export default function PurchaseForm() {
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

      const response = await axios.post("/api/purchase", purchaseData);

      if (response.data.success) {
        toast.success("Purchase created successfully");
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
          <h1 className="text-3xl font-bold text-gray-900">Add New Purchase</h1>
          <p className="text-lg text-gray-600 mt-1">
            Record a new purchase and update inventory
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-8 max-h-[80vh] overflow-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label
                htmlFor="customerId"
                className="text-lg font-medium text-gray-700"
              >
                Customer *
              </label>
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
              <label
                htmlFor="invoice"
                className="text-lg font-medium text-gray-700"
              >
                Invoice
              </label>
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
            <label
              htmlFor="modeOfTransport"
              className="text-lg font-medium text-gray-700"
            >
              Mode of Transport *
            </label>
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
            <label
              htmlFor="remark"
              className="text-lg font-medium text-gray-700"
            >
              Remark
            </label>
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
              <h2 className="text-xl font-semibold text-gray-800">
                Stock Entries
              </h2>
            </div>

            {stockEntries.map((entry, index) => (
              <div
                key={index}
                className={`border rounded-lg p-6 space-y-4 ${
                  !entry.isValid ? "border-red-300 bg-red-50" : ""
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
                    <label className="text-base font-medium text-gray-700">
                      Category *
                    </label>
                    <Select
                      value={entry.categoryId}
                      onValueChange={(value) =>
                        handleStockEntryChange(index, "categoryId", value)
                      }
                    >
                      <SelectTrigger
                        className={`text-base p-3 ${
                          entry.errors.categoryId ? "border-red-500" : ""
                        }`}
                      >
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
                      <p className="text-sm text-red-500">
                        {entry.errors.categoryId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-base font-medium text-gray-700">
                      Product *
                    </label>
                    <ProductSearchableSelect
                      value={entry.productId}
                      onChange={(value) =>
                        handleStockEntryChange(index, "productId", value)
                      }
                      products={products[index] || []}
                      disabled={!entry.categoryId}
                      className={entry.errors.productId ? "border-red-500" : ""}
                      placeholder="Select product"
                    />
                    {entry.errors.productId && (
                      <p className="text-sm text-red-500">
                        {entry.errors.productId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-base font-medium text-gray-700">
                      Godown *
                    </label>
                    <Select
                      value={entry.godownId}
                      onValueChange={(value) =>
                        handleStockEntryChange(index, "godownId", value)
                      }
                    >
                      <SelectTrigger
                        className={`text-base p-3 ${
                          entry.errors.godownId ? "border-red-500" : ""
                        }`}
                      >
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
                      <p className="text-sm text-red-500">
                        {entry.errors.godownId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-base font-medium text-gray-700">
                      Quantity *
                    </label>
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
                      className={`text-lg p-3 ${
                        entry.errors.quantity ? "border-red-500" : ""
                      }`}
                    />
                    {entry.errors.quantity && (
                      <p className="text-sm text-red-500">
                        {entry.errors.quantity}
                      </p>
                    )}
                  </div>
                </div>
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
              disabled={
                isSubmitting || stockEntries.some((entry) => !entry.isValid)
              }
            >
              {isSubmitting ? "Saving..." : "Create Purchase"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
