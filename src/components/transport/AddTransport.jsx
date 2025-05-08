"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchTransport } from "@/store/slices/transportSlice";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

export function AddTransport({
  selectedTransport,
  open,
  setOpen,
  setSelectedTransport,
  setFetchData,
}) {
  const dispatch = useDispatch()
  const [transport, setCategory] = useState({
    id: selectedTransport?._id || "",
    transport: selectedTransport?.transport || "",
  });

  useEffect(() => {
    if (open) {
      setCategory({
        id: selectedTransport?._id || "",
        transport: selectedTransport?.transport || "",
      });
    }
  }, [open, selectedTransport]);

  const handleSave = async () => {
    try {
      const response = await axios.post("/api/transport", transport);
      if (selectedTransport?._id)
        toast.success("Transport Updated successfully!");
      else toast.success("Transport Added successfully!");
      setCategory({ id: "", name: "" }); // Reset input
      setSelectedTransport({});
      dispatch(fetchTransport())
      setOpen(false);
    } catch (error) {
      console.error("Error saving transport:", error);
      toast.error(error.message.toString());
    } finally {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="w-full flex justify-end">
        <DialogTrigger asChild>
          <Button variant="outline" className="bg-buttonBg text-white">
            Add Transport
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-[555px]">
        <DialogHeader>
          <DialogTitle>
            {selectedTransport?._id ? "Update " : "New "} Transport
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-5 items-center gap-2 ">
            <p htmlFor="name" className=" font-medium text-md col-span-2">
              Transport Name :
            </p>
            <Input
              id="name"
              className="col-span-3"
              value={transport.transport}
              onChange={(e) => {
                setCategory((prev) => ({ ...prev, transport: e.target.value }));
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
