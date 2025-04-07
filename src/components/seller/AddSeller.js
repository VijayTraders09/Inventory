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
import { fetchBuyer } from "@/store/slices/buyerSlice";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

export function AddSeller({
  selectedSeller,
  hideAddButton,
  open,
  setOpen,
  setSelectedSeller,
  setFetchData,
}) {
  const [seller, setSeller] = useState({
    id: selectedSeller?._id || "",
    sellerName: selectedSeller?.sellerName || "",
    mobileNumber: selectedSeller?.mobileNumber,
  });

  const dispatch = useDispatch();

  useEffect(() => {
    if (open) {
      setSeller({
        id: selectedSeller?._id || "",
        sellerName: selectedSeller?.sellerName || "",
        mobileNumber: selectedSeller?.mobileNumber || "",
      });
    }
  }, [open, selectedSeller]);

  const handleSave = async () => {
    try {
      const response = await axios.post("/api/seller", seller);
      if (response.data.success) {
        toast.success(response.data.message);
        setSeller({ id: "", name: "", mobileNumber: "" }); // Reset input
        dispatch(fetchBuyer());
        setOpen(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error saving seller:", error);
      toast.error(error.message.toString());
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {hideAddButton ? (
        ""
      ) : (
        <div className="w-full flex justify-end">
          <DialogTrigger asChild>
            <Button variant="outline" className="bg-buttonBg text-white">
              Add Purchaser
            </Button>
          </DialogTrigger>
        </div>
      )}

      <DialogContent className="sm:max-w-[555px]">
        <DialogHeader>
          <DialogTitle>
            {selectedSeller?._id ? "Update " : "New "} Purchaser
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-5 items-center gap-2 ">
            <p htmlFor="name" className=" font-medium text-md col-span-2">
              Purchaser Name :
            </p>
            <Input
              id="name"
              className="col-span-3"
              value={seller.sellerName}
              onChange={(e) => {
                setSeller((prev) => ({ ...prev, sellerName: e.target.value }));
              }}
            />
          </div>
          <div className="grid grid-cols-5 items-center gap-2 ">
            <p htmlFor="name" className=" font-medium text-md col-span-2">
              Mobile Number :
            </p>
            <Input
              id="number"
              className="col-span-3"
              value={seller.mobileNumber}
              onChange={(e) => {
                setSeller((prev) => ({ ...prev, mobileNumber: e.target.value }));
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
