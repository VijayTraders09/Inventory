"use client";

import { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Edit, Trash2, Truck, Search } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function TransportGrid() {
  // Local state
  const [transports, setTransports] = useState([]);
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
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  // Fetch transports
  const fetchTransports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        search
      });
      
      const response = await axios.get(`/api/transport?${params}`);
      
      if (response.data.success) {
        setTransports(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.data.error || 'Failed to fetch transports');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'An error occurred while fetching transports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransports();
  }, [currentPage, search]);

  const handleEdit = (transport) => {
    setSelectedTransport(transport);
    setFormData({
      name: transport.name,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (transport) => {
    setSelectedTransport(transport);
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
      if (selectedTransport) {
        response = await axios.put(`/api/transport/${selectedTransport._id}`, formData);
      } else {
        response = await axios.post('/api/transport', formData);
      }

      if (response.data.success) {
        toast.success(response.data.message || 
          (selectedTransport ? 'Transport updated successfully' : 'Transport created successfully'));
        setIsFormOpen(false);
        setFormData({ name: '' });
        setSelectedTransport(null);
        fetchTransports(); // Refresh transports list
      } else {
        toast.error(response.data.error || 'Something went wrong');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransport = async () => {
    if (!selectedTransport) return;

    try {
      const response = await axios.delete(`/api/transport/${selectedTransport._id}`);
      
      if (response.data.success) {
        toast.success('Transport deleted successfully');
        setIsDeleteOpen(false);
        setSelectedTransport(null);
        fetchTransports(); // Refresh transports list
      } else {
        toast.error(response.data.error || 'Failed to delete transport');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete transport');
    }
  };

  const columnDefs = useMemo(() => [
    {
      headerName: 'Transport Name',
      field: 'name',
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      cellRenderer: (params) => (
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{params.value}</span>
        </div>
      )
    },
    {
      headerName: 'Created Date',
      field: 'createdAt',
      sortable: true,
      filter: true,
      resizable: true,
      width: 180,
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
      width: 150,
      cellRenderer: (params) => (
        <div className="flex space-x-2">
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
          <h1 className="text-3xl font-bold text-gray-900">Transports</h1>
          <p className="text-gray-600 mt-1">Manage your transport options</p>
        </div>
        <Button
          onClick={() => {
            setSelectedTransport(null);
            setFormData({ name: '' });
            setIsFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={loading}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Transport
        </Button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search transports..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={loading}>Search</Button>
      </form>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transports</p>
              <p className="text-2xl font-bold">{pagination.total}</p>
            </div>
            <Truck className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Page</p>
              <p className="text-2xl font-bold">{currentPage} of {pagination.pages}</p>
            </div>
            <div className="text-sm text-gray-500 border rounded px-2 py-1">
              {pagination.limit} per page
            </div>
          </div>
        </div>
      </div>

      {/* AG Grid Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="ag-theme-alpine" style={{ height: '400px', width: '100%' }}>
          <AgGridReact
            rowData={transports}
            columnDefs={columnDefs}
            loading={loading}
            pagination={false}
            suppressPaginationPanel={true}
            overlayLoadingTemplate={
              '<div class="ag-overlay-loading-center">Loading transports...</div>'
            }
            overlayNoRowsTemplate={
              '<div class="ag-overlay-loading-center">No transports found</div>'
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

      {/* Transport Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTransport ? 'Edit Transport' : 'Add New Transport'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Transport Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter transport name"
                required
              />
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (selectedTransport ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transport</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTransport?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTransport} 
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