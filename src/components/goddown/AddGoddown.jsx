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
import { fetchGoddowns } from "@/store/slices/goddownSlice";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

export function AddGoddown({
  selectedGoddown,
  open,
  setOpen,
  setSelectedGoddown,
  setFetchData,
}) {
  const [goddown, setCategory] = useState({
    id: selectedGoddown?._id || "",
    goddownName: selectedGoddown?.goddownName || "",
  });

  const dispatch = useDispatch();

  useEffect(() => {
    if (open) {
      setCategory({
        id: selectedGoddown?._id || "",
        goddownName: selectedGoddown?.goddownName || "",
      });
    }
  }, [open, selectedGoddown]);

  const handleSave = async () => {
    try {
      const response = await axios.post("/api/goddown", goddown);
      console.clear();
      console.log(response);
      if (response?.data.success) {
        toast.success(response.data.message);
        setCategory({ id: "", name: "" }); // Reset input
        setSelectedGoddown({});
        dispatch(fetchGoddowns());
        setOpen(false);
      } else {
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Error saving goddown:", error);
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
            Add Goddown
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-[555px]">
        <DialogHeader>
          <DialogTitle>
            {selectedGoddown?._id ? "Update " : "New "} Goddown
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-5 items-center gap-2 ">
            <p htmlFor="name" className=" font-medium text-md col-span-2">
              Goddown Name :
            </p>
            <Input
              id="name"
              className="col-span-3"
              value={goddown.goddownName}
              onChange={(e) => {
                setCategory((prev) => ({
                  ...prev,
                  goddownName: e.target.value,
                }));
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
