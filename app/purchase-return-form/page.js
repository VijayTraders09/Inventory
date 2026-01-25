"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Plus, X, AlertCircle, Package, Printer } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import SearchableSelect from "@/components/ui/searchable-select";
import TransportPopup from "@/components/transport/transportPopup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategorySearchableSelect } from "../../components/categories/category-dropdown";

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
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()),
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
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
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

export default function SalesForm() {
  // Local state
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [transports, setTransports] = useState([]);
  const [isTransportPopupOpen, setIsTransportPopupOpen] = useState(false);
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

  // New state for bill preview and printing
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [selectedPurchaseReturnPrint, setSelectedPurchaseReturnPrint] =
    useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

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
  const checkStockAvailability = async (
    productId,
    godownId,
    quantity,
    index,
  ) => {
    if (!productId || !godownId || !quantity) return;

    // Set loading state for this specific entry
    setStockCheckLoading((prev) => ({ ...prev, [index]: true }));

    try {
      const response = await axios.get(
        `/api/stocks/check?productId=${productId}&godownId=${godownId}&quantity=${quantity}`,
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
            `Insufficient stock. Available: ${availableQuantity}, Required: ${quantity}, Shortage: ${shortage}`,
          );
        }
      } else {
        toast.error(
          response.data.error || "Failed to check stock availability",
        );
      }
    } catch (error) {
      console.error("Error checking stock availability:", error);
      toast.error("Error checking stock availability");
    } finally {
      // Clear loading state for this specific entry
      setStockCheckLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const [categoriesRes, godownsRes, transportsRes] = await Promise.all([
        axios.get("/api/categories?limit=10000"),
        axios.get("/api/godown?limit=100"),
        axios.get("/api/transport"),
      ]);

      if (categoriesRes.data.success) setCategories(categoriesRes.data.data);
      if (godownsRes.data.success) setGodowns(godownsRes.data.data);
      if (transportsRes.data.success) setTransports(transportsRes.data.data);
    } catch (error) {
      toast.error("Failed to fetch dropdown data");
    }
  };

  // Fetch products by category
  const fetchProductsByCategory = async (categoryId, index) => {
    if (!categoryId) return;

    try {
      const response = await axios.get(
        `/api/products/by-category?categoryId=${categoryId}`,
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
      // checkStockAvailability(
      //   newEntries[index].productId,
      //   newEntries[index].godownId,
      //   newEntries[index].quantity,
      //   index
      // );
    }

    setStockEntries(newEntries);
  };

  const handleTransportAdded = (newTransport) => {
    // Update the transports list with the new transport
    setTransports([...transports, newTransport]);
    // Set the new transport as selected
    setFormData((prev) => ({ ...prev, modeOfTransport: newTransport._id }));
  };

  // Function to handle printing
  const handlePrintBill = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
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
      (entry) => !entry.isStockSufficient,
    );

    if (hasInsufficientStock) {
      toast.error(
        "Some items have insufficient stock. Please adjust quantities.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const saleData = {
        ...formData,
        stockEntries,
      };

      const response = await axios.post("/api/purchase-return", saleData);

      if (response.data.success) {
        toast.success("Purchase Return created successfully");

        // Set the purchase return data for printing
        setSelectedPurchaseReturnPrint(response.data.data);
        setShowBillPreview(true);

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
          <h1 className="text-3xl font-bold text-gray-900">
            Add New Purchase Return
          </h1>
          <p className="text-lg text-gray-600 mt-1">
            Record a new purchase return and update inventory
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-8 max-h-[80vh] overflow-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stock Entries - Moved to the top */}
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
                  !entry.isValid || !entry.isStockSufficient
                    ? "border-red-300 bg-red-50"
                    : ""
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
                    <CategorySearchableSelect
                      value={entry.categoryId}
                      onChange={(value) =>
                        handleStockEntryChange(index, "categoryId", value)
                      }
                      categories={categories}
                      className={
                        entry.errors.categoryId ? "border-red-500" : ""
                      }
                      placeholder="Select Category"
                    />

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
                        className={`text-base p-3 ${entry.errors.godownId ? "border-red-500" : ""}`}
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
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        value={entry.quantity}
                        onChange={(e) =>
                          handleStockEntryChange(
                            index,
                            "quantity",
                            parseInt(e.target.value),
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
                      <p className="text-sm text-red-500">
                        {entry.errors.quantity}
                      </p>
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
                          Insufficient stock. Available:{" "}
                          {entry.stockAvailable || 0}, Required:{" "}
                          {entry.quantity}, Shortage: {entry.shortage || 0}
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

          {/* Customer and Invoice Information - Moved after stock entries */}
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

          {/* Mode of Transport with Dropdown and Add Button */}
          <div className="space-y-2">
            <label
              htmlFor="modeOfTransport"
              className="text-lg font-medium text-gray-700"
            >
              Mode of Transport *
            </label>
            <div className="flex space-x-2">
              <Select
                value={formData.modeOfTransport}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, modeOfTransport: value }))
                }
              >
                <SelectTrigger className="text-lg p-3 flex-1">
                  <SelectValue placeholder="Select mode of transport" />
                </SelectTrigger>
                <SelectContent>
                  {transports.map((transport) => (
                    <SelectItem key={transport._id} value={transport.name}>
                      {transport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTransportPopupOpen(true)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* Remark */}
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

          {/* Submit Buttons */}
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
                isSubmitting ||
                stockEntries.some(
                  (entry) => !entry.isValid || !entry.isStockSufficient,
                )
              }
            >
              {isSubmitting ? "Saving..." : "Create Purchase Return"}
            </Button>
          </div>
        </form>
      </div>

      {/* Transport Popup */}
      <TransportPopup
        isOpen={isTransportPopupOpen}
        onClose={() => setIsTransportPopupOpen(false)}
        onTransportAdded={handleTransportAdded}
      />

      {/* Bill Preview Dialog */}
      <Dialog open={showBillPreview} onOpenChange={setShowBillPreview}>
        <DialogContent className="sm:max-w-[400px]  max-h-screen overflow-auto">
          <DialogHeader>
            <DialogTitle>Purchase Return Bill Preview</DialogTitle>
          </DialogHeader>
          {selectedPurchaseReturnPrint && (
            <div className="space-y-4">
              <div
                className="bg-white p-4 rounded-lg border"
                style={{ fontFamily: "monospace", fontSize: "12px" }}
              >
                <div className="text-center mb-4">
                  <div className="font-bold text-lg mb-2">
                    PURCHASE RETURN BILL
                  </div>
                  <div>Company Name</div>
                  <div>Address Line 1</div>
                  <div>Address Line 2</div>
                  <div>Phone: 1234567890</div>
                  <div className="border-t border-b border-gray-300 mt-2 mb-2 py-1">
                    ------------------------------------------
                  </div>
                </div>

                <div className="mb-4">
                  <div>
                    Bill No: {selectedPurchaseReturnPrint.invoice || "N/A"}
                  </div>
                  <div>
                    Date:{" "}
                    {new Date(
                      selectedPurchaseReturnPrint.createdAt,
                    ).toLocaleDateString()}
                  </div>
                  <div>
                    Customer:{" "}
                    {selectedPurchaseReturnPrint.customerId.customerName}
                  </div>
                  <div>
                    Transport: {selectedPurchaseReturnPrint.modeOfTransport}
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
                      {selectedPurchaseReturnPrint.stockEntries.map(
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
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="text-center">
                  <div className="border-t border-b border-gray-300 mt-2 mb-2 py-1">
                    ------------------------------------------
                  </div>
                  <div>
                    Total Items: {selectedPurchaseReturnPrint.totalQuantity}
                  </div>
                  <div className="border-t border-gray-300 mt-2 mb-2 py-1">
                    ------------------------------------------
                  </div>
                  <div>Thank you for your business!</div>
                  {selectedPurchaseReturnPrint.remark && (
                    <div className="mt-2">
                      Remark: {selectedPurchaseReturnPrint.remark}
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
                  disabled={!selectedPurchaseReturnPrint}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Component - Only rendered when printing */}
      {isPrinting && selectedPurchaseReturnPrint && (
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
              <div className="bill-title">PURCHASE RETURN BILL</div>
              {/* <div>Company Name</div>
              <div>Address Line 1</div>
              <div>Address Line 2</div>
              <div>Phone: 1234567890</div>
              <div>------------------------------------------</div> */}
            </div>

            <div className="bill-info">
              <div>Bill No: {selectedPurchaseReturnPrint.invoice || "N/A"}</div>
              <div>
                Date:{" "}
                {new Date(
                  selectedPurchaseReturnPrint.createdAt,
                ).toLocaleDateString()}
              </div>
              <div>
                Customer: {selectedPurchaseReturnPrint.customerId.customerName}
              </div>
              <div>
                Transport: {selectedPurchaseReturnPrint.modeOfTransport}
              </div>
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
                {selectedPurchaseReturnPrint.stockEntries.map(
                  (entry, index) => (
                    <tr key={index}>
                      <td>{entry.productId.productName}</td>
                      <td>{entry.quantity}</td>
                      <td>{entry.godownId.godownName}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>

            <div className="bill-footer">
              <div>------------------------------------------</div>
              <div>
                Total Items: {selectedPurchaseReturnPrint.totalQuantity}
              </div>
              <div>------------------------------------------</div>
              <div>Thank you for your business!</div>
              {selectedPurchaseReturnPrint.remark && (
                <div>Remark: {selectedPurchaseReturnPrint.remark}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
