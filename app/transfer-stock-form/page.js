"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

export default function StockTransferForm() {
  const [godowns, setGodowns] = useState([]);
  const [fromGodownId, setFromGodownId] = useState("");
  const [toGodownId, setToGodownId] = useState("");
  const [stocks, setStocks] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingStocks, setFetchingStocks] = useState(false);

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
    }
  }, [fromGodownId]);

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
        // Initialize selected items with 0 quantity
        setSelectedItems(
          response.data.data.map(stock => ({
            productId: stock.productId._id,
            categoryId: stock.categoryId._id,
            productName: stock.productId.productName,
            categoryName: stock.categoryId.categoryName,
            availableQuantity: stock.quantity,
            transferQuantity: 0,
          }))
        );
      }
    } catch (error) {
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
        // Reset form
        setFromGodownId("");
        setToGodownId("");
        setStocks([]);
        setSelectedItems([]);
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
    <div className="space-y-3 p-4 bg-gray-50 min-h-screen max-w-[90%] m-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Transfer</h1>
          <p className="text-lg text-gray-600 mt-1">Transfer stock between godowns</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-8 max-h-[80vh] overflow-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Godown Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="fromGodown" className="text-lg font-medium text-gray-700">From Godown *</label>
              <Select
                value={fromGodownId}
                onValueChange={setFromGodownId}
                disabled={loading}
              >
                <SelectTrigger className="text-lg p-3">
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
              <label htmlFor="toGodown" className="text-lg font-medium text-gray-700">To Godown *</label>
              <Select
                value={toGodownId}
                onValueChange={setToGodownId}
                disabled={loading || !fromGodownId}
              >
                <SelectTrigger className="text-lg p-3">
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
                <h2 className="text-xl font-semibold text-gray-800">Stock Items</h2>
                <Badge variant="outline">
                  Total Transfer: {totalTransferItems} items
                </Badge>
              </div>
              
              {fetchingStocks ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : stocks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No stock found in this godown</p>
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
            <label htmlFor="remark" className="text-lg font-medium text-gray-700">Remark</label>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Enter transfer remark (optional)"
              rows={3}
              className="text-lg p-3"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 mt-8">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="text-lg px-6 py-3"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="text-lg px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading || totalTransferItems === 0}
            >
              {loading ? "Transferring..." : "Transfer Stock"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}