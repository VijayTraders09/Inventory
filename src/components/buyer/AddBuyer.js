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

export function AddBuyer({
  selectedBuyer,
  hideAddButton,
  open,
  setOpen,
  setSelectedBuyer,
  setFetchData,
}) {
  const [buyer, setBuyer] = useState({
    id: selectedBuyer?._id || "",
    buyerName: selectedBuyer?.buyerName || "",
    mobileNumber: selectedBuyer?.mobileNumber,
  });

  const dispatch = useDispatch();

  useEffect(() => {
    if (open) {
      setBuyer({
        id: selectedBuyer?._id || "",
        buyerName: selectedBuyer?.buyerName || "",
        mobileNumber: selectedBuyer?.mobileNumber || "",
      });
    }
  }, [open, selectedBuyer]);

  const handleSave = async () => {
    try {
      const response = await axios.post("/api/buyer", buyer);
      if (response.data.success) {
        toast.success(response.data.message);
        setBuyer({ id: "", name: "", mobileNumber: "" }); // Reset input
        dispatch(fetchBuyer());
        setOpen(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error saving buyer:", error);
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
              Add Buyer
            </Button>
          </DialogTrigger>
        </div>
      )}

      <DialogContent className="sm:max-w-[555px]">
        <DialogHeader>
          <DialogTitle>
            {selectedBuyer?._id ? "Update " : "New "} Buyer
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-5 items-center gap-2 ">
            <p htmlFor="name" className=" font-medium text-md col-span-2">
              Buyer Name :
            </p>
            <Input
              id="name"
              className="col-span-3"
              value={buyer.buyerName}
              onChange={(e) => {
                setBuyer((prev) => ({ ...prev, buyerName: e.target.value }));
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
              value={buyer.mobileNumber}
              onChange={(e) => {
                setBuyer((prev) => ({ ...prev, mobileNumber: e.target.value }));
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
