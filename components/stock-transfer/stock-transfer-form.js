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
  Plus,
  Minus,
  Package,
  Building,
  ArrowRightLeft,
  X,
  AlertCircle,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

export default function StockTransferForm({ isOpen, onClose, onTransferComplete }) {
  const [godowns, setGodowns] = useState([]);
  const [fromGodownId, setFromGodownId] = useState(0);
  const [toGodownId, setToGodownId] = useState(0);
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingStocks, setFetchingStocks] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch godowns on component mount
  useEffect(() => {
    fetchGodowns();
  }, []);

  // Fetch stocks when fromGodownId changes
  useEffect(() => {
    if (fromGodownId) {
      fetchStocks(fromGodownId);
    } else {
      setStocks([]);
      setSelectedItems([]);
      setFilteredStocks([]);
      setSearchTerm("");
    }
  }, [fromGodownId]);

  // Filter stocks when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredStocks(stocks);
    } else {
      const filtered = stocks.filter(stock => 
        stock?.productId?.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock?.categoryId?.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStocks(filtered);
    }
  }, [searchTerm, stocks]);

  // Update selected items when filtered stocks change
  useEffect(() => {
    setSelectedItems(
      filteredStocks.map(stock => {
        // Check if this item was already selected
        const existingItem = selectedItems.find(item => item.productId === stock?.productId?._id);
        return {
          productId: stock?.productId?._id,
          categoryId: stock?.categoryId?._id,
          productName: stock?.productId?.productName,
          categoryName: stock?.categoryId?.categoryName,
          availableQuantity: stock?.quantity,
          transferQuantity: existingItem ? existingItem.transferQuantity : 0,
        };
      })
    );
  }, [filteredStocks]);

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

  const fetchStocks = async (godownId) => {
    setFetchingStocks(true);
    try {
      const response = await axios.get(`/api/stocks/stock-transfer-by-godown?godownId=${godownId}`);
      if (response.data.success) {
        setStocks(response.data.data);
        setFilteredStocks(response.data.data);
        // Initialize selected items with 0 quantity
        setSelectedItems(
          response.data.data.map(stock => ({
            productId: stock?.productId?._id,
            categoryId: stock?.categoryId?._id,
            productName: stock?.productId?.productName,
            categoryName: stock?.categoryId?.categoryName,
            availableQuantity: stock?.quantity,
            transferQuantity: 0,
          }))
        );
      }
    } catch (error) {
      console.log(error)
      toast.error("Failed to fetch stocks");
    } finally {
      setFetchingStocks(false);
    }
  };

  const handleQuantityChange = (productId, value) => {
    const quantity = parseInt(value) || 0;
    setSelectedItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, transferQuantity: Math.min(quantity, item.availableQuantity) }
          : item
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!fromGodownId || !toGodownId) {
      toast.error("Please select both source and destination godowns");
      return;
    }
    
    if (fromGodownId === toGodownId) {
      toast.error("Source and destination godowns cannot be the same");
      return;
    }
    
    const itemsToTransfer = selectedItems.filter(item => item.transferQuantity > 0);
    if (itemsToTransfer.length === 0) {
      toast.error("Please select at least one item to transfer");
      return;
    }
    
    setLoading(true);
    try {
      const transferData = {
        fromGodownId,
        toGodownId,
        remark,
        items: itemsToTransfer.map(item => ({
          productId: item.productId,
          categoryId: item.categoryId,
          quantity: item.transferQuantity
        }))
      };
      
      const response = await axios.post("/api/stock-transfer", transferData);
      
      if (response.data.success) {
        toast.success("Stock transferred successfully");
        onClose();
        onTransferComplete && onTransferComplete();
        // Reset form
        setFromGodownId("");
        setToGodownId("");
        setStocks([]);
        setSelectedItems([]);
        setFilteredStocks([]);
        setSearchTerm("");
        setRemark("");
      } else {
        toast.error(response.data.error || "Failed to transfer stock");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error transferring stock");
    } finally {
      setLoading(false);
    }
  };

  const totalTransferItems = selectedItems.reduce(
    (sum, item) => sum + item.transferQuantity,
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Stock Transfer
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Godown Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromGodown">From Godown *</Label>
              <Select
                value={fromGodownId}
                onValueChange={setFromGodownId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source godown" />
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
            
            <div className="space-y-2">
              <Label htmlFor="toGodown">To Godown *</Label>
              <Select
                value={toGodownId}
                onValueChange={setToGodownId}
                disabled={loading || !fromGodownId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination godown" />
                </SelectTrigger>
                <SelectContent>
                  {godowns
                    .filter(g => g._id !== fromGodownId)
                    .map((godown) => (
                      <SelectItem key={godown._id} value={godown._id}>
                        {godown.godownName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stock Items */}
          {fromGodownId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Stock Items</Label>
                <Badge variant="outline">
                  Total Transfer: {totalTransferItems} items
                </Badge>
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by product name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {fetchingStocks ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredStocks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>
                    {searchTerm 
                      ? "No stock found matching your search" 
                      : "No stock found in this godown"}
                  </p>
                </div>
              ) : (
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
                          Available
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">
                          Transfer Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedItems.map((item, index) => (
                        <tr key={item.productId}>
                          <td className="px-4 py-2 text-sm">
                            {item.productName}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {item.categoryName}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <Badge variant="outline">{item.availableQuantity}</Badge>
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.productId,
                                    item.transferQuantity - 1
                                  )
                                }
                                disabled={item.transferQuantity <= 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min="0"
                                max={item.availableQuantity}
                                value={item.transferQuantity}
                                onChange={(e) =>
                                  handleQuantityChange(item.productId, e.target.value)
                                }
                                className="w-20 text-center"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.productId,
                                    item.transferQuantity + 1
                                  )
                                }
                                disabled={item.transferQuantity >= item.availableQuantity}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Remark */}
          <div className="space-y-2">
            <Label htmlFor="remark">Remark</Label>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Enter transfer remark (optional)"
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
              disabled={loading || totalTransferItems === 0}
            >
              {loading ? "Transferring..." : "Transfer Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}