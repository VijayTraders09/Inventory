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
import { Plus, Edit, Trash2, Package, Search, Box, Building, X, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import axios from "axios";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function ProductGrid() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId");
  const categoryName = searchParams.get("categoryName");
  
  // Local state instead of Redux
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    productName: '',
    categoryId: categoryId || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  
  // Stock popup states
  const [isStockPopupOpen, setIsStockPopupOpen] = useState(false);
  const [stockData, setStockData] = useState({
    productId: '',
    godowns: []
  });
  const [stockLoading, setStockLoading] = useState(false);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        search,
        categoryId: categoryId || ''
      });
      
      const response = await axios.get(`/api/products?${params}`);
      
      if (response.status == 200) {
        setProducts(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.data.error || 'Failed to fetch products');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'An error occurred while fetching products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories?limit=10000');
      if (response.status == 200) {
        setCategories(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  // Fetch stock data for a product
  const fetchStockData = async (productId) => {
    setStockLoading(true);
    try {
      const response = await axios.get(`/api/stocks/by-product?productId=${productId}`);
      if (response.status == 200) {
        setStockData(response.data.data);
        setIsStockPopupOpen(true);
      } else {
        toast.error('Failed to fetch stock data');
      }
    } catch (error) {
      toast.error('An error occurred while fetching stock data');
    } finally {
      setStockLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, search, categoryId]);

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      productName: product.productName,
      categoryId: product.categoryId._id,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (product) => {
    setSelectedProduct(product);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let response;
      if (selectedProduct) {
        response = await axios.put(`/api/products/${selectedProduct._id}`, formData);
      } else {
        response = await axios.post('/api/products', {...formData, categoryId: categoryId || formData.categoryId});
      }

      if (response.status == 201 || response.status == 200) {
        toast.success(response.data.message || 
          (selectedProduct ? 'Product updated successfully' : 'Product created successfully'));
        setIsFormOpen(false);
        setFormData({ productName: '', categoryId: categoryId || '' });
        setSelectedProduct(null);
        fetchProducts(); // Refresh products list
      } else {
        toast.error(response.data.error || 'Something went wrong');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      const response = await axios.delete(`/api/products/${selectedProduct._id}`);
      
      if (response.data.success) {
        toast.success('Product deleted successfully');
        setIsDeleteOpen(false);
        setSelectedProduct(null);
        fetchProducts(); // Refresh products list
      } else {
        toast.error(response.data.error || 'Failed to delete product');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete product');
    }
  };

  // AG Grid column definitions for stock popup
  const stockColumnDefs = useMemo(() => [
    {
      headerName: 'Godown Name',
      field: 'godownName',
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      cellRenderer: (params) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{params.value}</span>
        </div>
      )
    },
    {
      headerName: 'Total Quantity',
      field: 'totalQuantity',
      sortable: true,
      filter: true,
      resizable: true,
      width: 150,
      cellRenderer: (params) => (
        <Badge variant="outline">{params.value}</Badge>
      )
    }
  ], []);

  const columnDefs = useMemo(() => [
    {
      headerName: 'Product Name',
      field: 'productName',
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      cellRenderer: (params) => (
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{params.value}</span>
        </div>
      )
    },
    {
      headerName: 'Category',
      field: 'categoryId.categoryName',
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      cellRenderer: (params) => (
        <Badge variant="outline">
          {params.data.categoryId.categoryName}
        </Badge>
      )
    },
    {
      headerName: 'Quantity',
      field: 'quantity',
      sortable: true,
      filter: true,
      resizable: true,
      width: 120,
      cellRenderer: (params) => (
        <Badge variant="outline">{params.value}</Badge>
      )
    },
    {
      headerName: 'Created',
      field: 'createdAt',
      sortable: true,
      filter: true,
      resizable: true,
      width: 150,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString();
      }
    },
    {
      headerName: 'Actions',
      field: '_id',
      sortable: false,
      filter: false,
      resizable: false,
      width: 250,
      cellRenderer: (params) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStockData(params.data._id)}
            disabled={loading}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Stocks
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
      )
    }
  ], [loading]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products ({categoryName})</h1>
          <p className="text-gray-600 mt-1">Manage your inventory products</p>
        </div>
        <Button
          onClick={() => {
            setSelectedProduct(null);
            setFormData({ productName: '', categoryId: categoryId || '' });
            setIsFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={loading}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={loading}>Search</Button>
      </form>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold">{pagination.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p?.quantity > 0).length}
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800">Available</Badge>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">
                {products.filter(p => p?.quantity > 0 && p?.quantity < 10).length}
              </p>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800">Low</Badge>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {products.filter(p => p?.quantity === 0).length}
              </p>
            </div>
            <Badge className="bg-red-100 text-red-800">Out</Badge>
          </div>
        </div>
      </div>

      {/* AG Grid Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="ag-theme-alpine" style={{ height: '400px', width: '100%' }}>
          <AgGridReact
            rowData={products}
            columnDefs={columnDefs}
            loading={loading}
            pagination={false}
            suppressPaginationPanel={true}
            overlayLoadingTemplate={
              '<div class="ag-overlay-loading-center">Loading products...</div>'
            }
            overlayNoRowsTemplate={
              '<div class="ag-overlay-loading-center">No products found</div>'
            }
          />
        </div>
      </div>

      {/* Custom Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
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

      {/* Product Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                placeholder="Enter product name"
                required
              />
            </div>
            {!categoryId && (
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger>
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
              </div>
            )}
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
                {isSubmitting ? 'Saving...' : (selectedProduct ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProduct?.productName}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stock Details Popup */}
      <Dialog open={isStockPopupOpen} onOpenChange={setIsStockPopupOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Details for "{selectedProduct?.productName}"</DialogTitle>
          </DialogHeader>
          {stockLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Total Stock: {stockData.overallTotal} items
                  </h3>
                </div>
              </div>
              
              <div className="ag-theme-alpine" style={{ height: '300px', width: '100%' }}>
                <AgGridReact
                  rowData={stockData.godowns}
                  columnDefs={stockColumnDefs}
                  pagination={false}
                  suppressPaginationPanel={true}
                />
              </div>
              
              <div className="flex justify-end mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsStockPopupOpen(false)}
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