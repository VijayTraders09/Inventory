"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Download,
  Lock,
} from "lucide-react";
import { toast } from "react-hot-toast";
import CategoryForm from "./category-form";
import CategoryDeleteDialog from "./category-delete-dialog";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import Link from "next/link";
import * as XLSX from "xlsx";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Password protection states
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingAction, setPendingAction] = useState(null); // 'edit' or 'delete'
  const [showPassword, setShowPassword] = useState(false);
  const CORRECT_PASSWORD = "Vijay@1234";

  const fetchCategories = useCallback(
    async (page = 1, search = "", limit = 10) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search,
        });

        const response = await fetch(`/api/categories?${params}`);
        const data = await response.json();

        if (response.ok) {
          setCategories(data.data);
          setPagination(data.pagination);
        } else {
          toast.error("Failed to fetch categories");
        }
      } catch (error) {
        toast.error("An error occurred while fetching categories");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCategories(pagination.page, searchTerm, pagination.limit);
  }, [
    fetchCategories,
    pagination.page,
    searchTerm,
    pagination.limit,
    refreshKey,
  ]);

  // Password validation
  const validatePassword = () => {
    if (passwordInput === CORRECT_PASSWORD) {
      setPasswordError("");
      setIsPasswordDialogOpen(false);
      setPasswordInput("");
      setShowPassword(false);
      
      // Execute the pending action
      if (pendingAction === 'edit' && selectedCategory) {
        proceedWithEdit();
      } else if (pendingAction === 'delete' && selectedCategory) {
        proceedWithDelete();
      }
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  // Handle edit with password protection
  const handleEdit = (category) => {
    setSelectedCategory(category);
    setPendingAction('edit');
    setIsPasswordDialogOpen(true);
  };

  // Proceed with edit after password validation
  const proceedWithEdit = () => {
    setIsFormOpen(true);
    setPendingAction(null);
  };

  // Handle delete with password protection
  const handleDelete = (category) => {
    setSelectedCategory(category);
    setPendingAction('delete');
    setIsPasswordDialogOpen(true);
  };

  // Proceed with delete after password validation
  const proceedWithDelete = () => {
    setIsDeleteOpen(true);
    setPendingAction(null);
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCategories(1, searchTerm, pagination.limit);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Export categories to Excel
  const exportCategoriesToExcel = async () => {
    try {
      // Get all categories (no pagination)
      const params = new URLSearchParams({
        search: searchTerm,
        limit: "1000", // Set a high limit to get all data
      });

      const response = await fetch(`/api/categories?${params}`);
      const data = await response.json();

      if (response.ok) {
        const allCategories = data.data;

        // Prepare data for Excel export
        const exportData = allCategories.map((category) => ({
          "Category Name": category.categoryName || "N/A",
          "Created Date": new Date(category.createdAt).toLocaleDateString(),
          "Updated Date": new Date(category.updatedAt).toLocaleDateString(),
        }));

        // Create a new workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");

        // Generate buffer
        const buffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "buffer",
        });

        // Create a download link
        const url = window.URL.createObjectURL(new Blob([buffer]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "categories.xlsx");
        document.body.appendChild(link);
        link.click();
        link.remove();

        toast.success("Categories exported successfully");
      } else {
        toast.error("Failed to fetch categories for export");
      }
    } catch (error) {
      console.error("Error exporting categories:", error);
      toast.error("Failed to export categories");
    }
  };

  const ProductsButtonCell = ({ data }) => {
    return (
      <Link
        href={`/inventory/product?categoryId=${data._id}&categoryName=${data.categoryName}`}
      >
        <Button variant="outline" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          See Products
        </Button>
      </Link>
    );
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Category Name",
        field: "categoryName",
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
      },
      {
        headerName: "Created At",
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
        flex: 1,
        cellRenderer: (params) => {
          return (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(params.data)}
                disabled={loading}
              >
                <Lock className="h-4 w-4 mr-1" />
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(params.data)}
                className="text-red-600 hover:text-red-700"
                disabled={loading}
              >
                <Lock className="h-4 w-4 mr-1" />
                <Trash2 className="h-4 w-4" />
              </Button>
              <ProductsButtonCell data={params.data} />
            </div>
          );
        },
      },
    ],
    [loading]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Categories</h1>
        <div className="flex gap-2">
          <Button
            onClick={exportCategoriesToExcel}
            variant="outline"
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button
            onClick={() => {
              setSelectedCategory(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex space-x-2">
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit">Search</Button>
      </form>

      <div
        className="ag-theme-alpine"
        style={{ height: "460px", width: "100%" }}
      >
        <AgGridReact
          rowData={categories}
          columnDefs={columnDefs}
          loading={loading}
          pagination={false}
          suppressPaginationPanel={true}
          overlayLoadingTemplate={
            '<div class="ag-overlay-loading-center">Loading categories...</div>'
          }
          overlayNoRowsTemplate={
            '<div class="ag-overlay-loading-center">No categories found</div>'
          }
        />
      </div>

      {/* Custom Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} entries
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="rowsPerPage">Rows per page:</Label>
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
            <ChevronLeft className="h-4 w-4" />
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
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category Form Dialog */}
      {isFormOpen && (
        <CategoryForm
          category={selectedCategory}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Category Delete Dialog */}
      {isDeleteOpen && (
        <CategoryDeleteDialog
          category={selectedCategory}
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Password Protection Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Authentication Required
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please enter the password to {pendingAction === 'edit' ? 'edit' : 'delete'} this category.
            </p>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="Enter password"
                  className={`pr-10 ${passwordError ? "border-red-500" : ""}`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      validatePassword();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsPasswordDialogOpen(false);
                  setPasswordInput("");
                  setPasswordError("");
                  setShowPassword(false);
                  setPendingAction(null);
                  setSelectedCategory(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={validatePassword}>
                Authenticate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}