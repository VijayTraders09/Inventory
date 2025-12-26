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
import { addDoc, collection, db, doc, updateDoc } from "@/firebase/config";
import { fetchProductsByCategory } from "@/store/slices/productSlice";
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

export function AddProduct({
  selectedProduct,
  open,
  setOpen,
  setSelectedProduct,
  setFetchData,
}) {
  const dispatch = useDispatch();
  const params = useParams();
  const [product, setCategory] = useState({
    id: selectedProduct?._id || "",
    productName: selectedProduct?.productName || "",
    categoryId: params.categoryId,
  });

  useEffect(() => {
    if (open) {
      setCategory({
        id: selectedProduct?._id || "",
        productName: selectedProduct?.productName || "",
        categoryId: params.categoryId,
      });
    }
  }, [open]);

  const handleSave = async () => {
    try {
      const response = await axios.post("/api/products", product);
      if (response.data.success) {
        if (selectedProduct?._id)
          toast.success("Product Updated successfully!");
        else toast.success("Product Added successfully!");
        setCategory({ id: "", name: "" }); // Reset input
        setSelectedProduct({});
        dispatch(fetchProductsByCategory(params.categoryId));
        setOpen(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error saving product:", error);
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
            Add Product
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-[555px]">
        <DialogHeader>
          <DialogTitle>
            {selectedProduct?.id ? "Update " : "New "} Product
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-5 items-center gap-2 ">
            <p htmlFor="name" className=" font-medium text-md col-span-2">
              Product Name :
            </p>
            <Input
              id="name"
              className="col-span-3"
              value={product.productName}
              onChange={(e) => {
                setCategory((prev) => ({
                  ...prev,
                  productName: e.target.value,
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
