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
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export function GetSaleByInvoiceNumber({
  open,
  setOpen,
  setSale,
  hideAddButton
}) {
  const [invoiceNumber, setInvoiceNumber] = useState("");

  useEffect(() => {
    if (open) {
      setInvoiceNumber('');
    }
  }, [open]);

  const handleSave = async () => {
    try {
      const response = await axios.get("/api/sell/" + invoiceNumber);
      if (response.data.success) {
        if (response.data.data?.length) {
          let data = response.data.data[0];
          setSale((prev) => ({
            ...prev,
            buyer: data.buyerId._id,
            goddown: data.godownId._id,
            items: data.items?.map((item) => ({
              categoryId: item.categoryId._id,
              productId: item.productId._id,
              productName: item.productId.productName,
              categoryName: item.categoryId.categoryName,
              saleQuantity: item.quantity,
              quantity: 0,
              _id: item._id,
            })),
            modeOfTransport: 0,
            saleInvoice: data.invoiceNumber,
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
              Get Sale Invoice Number
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
