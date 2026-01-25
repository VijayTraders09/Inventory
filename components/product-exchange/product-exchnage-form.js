// components/product-exchange-form.js
"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRightLeft,
  X,
  AlertCircle,
  Package,
  Building,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { ProductSearchableSelect } from "../products/product-dropdown";
import { CategorySearchableSelect } from "../categories/category-dropdown";

export default function ProductExchangeForm({
  isOpen,
  onClose,
  onExchangeComplete,
}) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [categoryId, setCategoryId] = useState(0);
  const [fromProductId, setFromProductId] = useState(0);
  const [toProductId, setToProductId] = useState(0);
  const [fromGodownId, setFromGodownId] = useState(0);
  const [toGodownId, setToGodownId] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromStock, setFromStock] = useState(null);
  const [toStock, setToStock] = useState(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
    fetchGodowns();
  }, []);

  // Fetch products when categoryId changes
  useEffect(() => {
    if (categoryId) {
      fetchProducts(categoryId);
    } else {
      setProducts([]);
      setFromProductId("");
      setToProductId("");
    }
  }, [categoryId]);

  // Fetch from stock when fromProductId and fromGodownId change
  useEffect(() => {
    if (fromProductId && fromGodownId) {
      fetchStock(fromProductId, fromGodownId, "from");
    } else {
      setFromStock(null);
    }
  }, [fromProductId, fromGodownId]);

  // Fetch to stock when toProductId and toGodownId change
  useEffect(() => {
    if (toProductId && toGodownId) {
      fetchStock(toProductId, toGodownId, "to");
    } else {
      setToStock(null);
    }
  }, [toProductId, toGodownId]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/categories?limit=100");
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch categories");
    }
  };

  const fetchProducts = async (catId) => {
    try {
      const response = await axios.get(`/api/products?categoryId=${catId}`);
      setProducts(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch products");
    }
  };

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

  const fetchStock = async (productId, godownId, type) => {
    try {
      const response = await axios.get(
        `/api/stocks/stock-by-product-and-godown?productId=${productId}&godownId=${godownId}`,
      );

      if (response.data.success) {
        if (type === "from") {
          setFromStock(response.data.data);
        } else {
          setToStock(response.data.data);
        }
      }
    } catch (error) {
      if (type === "from") {
        setFromStock(null);
      } else {
        setToStock(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (
      !categoryId ||
      !fromProductId ||
      !toProductId ||
      !fromGodownId ||
      !toGodownId
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (fromProductId === toProductId && fromGodownId === toGodownId) {
      toast.error("Source and destination cannot be the same");
      return;
    }

    if (!fromStock || fromStock.quantity < quantity) {
      toast.error("Insufficient stock in the source godown");
      return;
    }

    setLoading(true);
    try {
      const exchangeData = {
        categoryId,
        fromProductId,
        toProductId,
        fromGodownId,
        toGodownId,
        quantity: parseInt(quantity),
        remark,
      };

      const response = await axios.post("/api/product-exchange", exchangeData);

      if (response.data.success) {
        toast.success("Product exchanged successfully");
        onClose();
        onExchangeComplete && onExchangeComplete();
        // Reset form
        setCategoryId("");
        setFromProductId("");
        setToProductId("");
        setFromGodownId("");
        setToGodownId("");
        setQuantity(1);
        setRemark("");
        setFromStock(null);
        setToStock(null);
      } else {
        toast.error(response.data.error || "Failed to exchange product");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error exchanging product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Product Exchange
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>

            <CategorySearchableSelect
              value={categoryId}
              onChange={(value) => setCategoryId(value)}
              categories={categories}
              placeholder="Select Category"
            />
          </div>

          {/* From Product and Godown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromProduct">From Product *</Label>
              <ProductSearchableSelect
                value={fromProductId}
                onChange={(value) => setFromProductId(value)}
                products={products}
                disabled={loading || !categoryId}
                placeholder="Select product"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromGodown">From Godown *</Label>
              <Select
                value={fromGodownId}
                onValueChange={setFromGodownId}
                disabled={loading || !fromProductId}
              >
                <SelectTrigger>
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
            </div>
          </div>

          {/* Display From Stock Info */}
          {fromStock && (
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Available Stock: {fromStock.quantity} units
                </span>
              </div>
            </div>
          )}

          {/* To Product and Godown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="toProduct">To Product *</Label>
              <ProductSearchableSelect
                value={toProductId}
                onChange={(value) => setToProductId(value)}
                products={products}
                disabled={loading || !categoryId}
                placeholder="Select product"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toGodown">To Godown *</Label>
              <Select
                value={toGodownId}
                onValueChange={setToGodownId}
                disabled={loading || !toProductId}
              >
                <SelectTrigger>
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
            </div>
          </div>

          {/* Display To Stock Info */}
          {toStock && (
            <div className="bg-green-50 p-3 rounded-md">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Current Stock: {toStock.quantity} units
                </span>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={loading || !fromStock}
            />
            {fromStock && (
              <p className="text-xs text-gray-500">
                Maximum available: {fromStock.quantity} units
              </p>
            )}
          </div>

          {/* Remark */}
          <div className="space-y-2">
            <Label htmlFor="remark">Remark</Label>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Enter exchange remark (optional)"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !fromStock || quantity > fromStock.quantity}
            >
              {loading ? "Processing..." : "Exchange Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
