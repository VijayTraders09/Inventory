"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Trash2, Edit } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

export default function TransportPopup({ isOpen, onClose, onTransportAdded }) {
  const [transports, setTransports] = useState([]);
  const [newTransportName, setNewTransportName] = useState("");
  const [editingTransport, setEditingTransport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch transports when popup opens
  useEffect(() => {
   
  }, [isOpen]);


  const handleAddTransport = async (e) => {
    e.preventDefault();
    
    if (!newTransportName.trim()) {
      toast.error("Transport name is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post("/api/transport", {
        name: newTransportName.trim(),
      });

      if (response.data.success) {
        toast.success("Transport added successfully");
        onClose()
        setNewTransportName("");
        if (onTransportAdded) {
          onTransportAdded(response.data.data);
        }
      } else {
        toast.error(response.data.error || "Failed to add transport");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransport = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transport?")) {
      return;
    }

    try {
      const response = await axios.delete(`/api/transport/${id}`);
      if (response.data.success) {
        toast.success("Transport deleted successfully");
        fetchTransports();
      } else {
        toast.error(response.data.error || "Failed to delete transport");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "An error occurred");
    }
  };

  const handleEditTransport = (transport) => {
    setEditingTransport(transport);
    setNewTransportName(transport.name);
  };

  const handleUpdateTransport = async (e) => {
    e.preventDefault();
    
    if (!newTransportName.trim()) {
      toast.error("Transport name is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.put(`/api/transport/${editingTransport._id}`, {
        name: newTransportName.trim(),
      });

      if (response.data.success) {
        toast.success("Transport updated successfully");
        setNewTransportName("");
        setEditingTransport(null);
        fetchTransports();
        if (onTransportAdded) {
          onTransportAdded(response.data.data);
        }
      } else {
        toast.error(response.data.error || "Failed to update transport");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTransport(null);
    setNewTransportName("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Manage Transport Options</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          <form onSubmit={editingTransport ? handleUpdateTransport : handleAddTransport}>
            <div className="flex space-x-2 mb-4">
              <Input
                value={newTransportName}
                onChange={(e) => setNewTransportName(e.target.value)}
                placeholder="Enter transport name"
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editingTransport ? "Update" : <Plus className="h-4 w-4" />}
              </Button>
              {editingTransport && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}