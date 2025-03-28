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

export function GetPurchaseByInvoiceNumber({
  open,
  setOpen,
  selectedInvoiceNumber,
  setPurchase,
}) {
  const [invoiceNumber, setInvoiceNumber] = useState("");

  useEffect(() => {
    if (open) {
      setInvoiceNumber(selectedInvoiceNumber);
    }
  }, [open, selectedSeller]);

  const handleSave = async () => {
    try {
      const response = await axios.get("/api/purchase/" + invoiceNumber);
      if (response.data.success) {
        console.log(response.data.data);
        if (response.data.data?.length) {
          let data = response.data.data[0];
          setPurchase((prev) => ({
            ...prev,
            seller: data.sellerId._id,
            goddown: data.godownId._id,
            items: data.items?.map((item) => ({
              categoryId: item.categoryId._id,
              productId: item.productId._id,
              productName: item.productId.productName,
              categoryName: item.categoryId.categoryName,
              purchasedQuantity: item.quantity,
              quantity: 0,
              _id: item._id,
            })),
            modeOfTransport: 0,
            purchaseInvoice: data.invoiceNumber,
            remark: "",
          }));
          setInvoiceNumber(""); // Reset input
          setOpen(false);
        }
        toast.success(response.data.message);
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
              Get Purchase Invoice Number
            </Button>
          </DialogTrigger>
        </div>
      )}

      <DialogContent className="sm:max-w-[555px]">
        <DialogHeader>
          <DialogTitle>Invoice Number</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-5 items-center gap-2 ">
            <Input
              id="name"
              className="col-span-3"
              value={invoiceNumber}
              onChange={(e) => {
                setInvoiceNumber(e.target.value);
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Get
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
