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
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export function AddProduct({
  selectedProduct,
  open,
  setOpen,
  setSelectedProduct,
  setFetchData
}) {
  const params = useParams();
  const [product, setCategory] = useState({
    id: selectedProduct?.id || "",
    product: selectedProduct?.product || "",
    categoryId:params.product
  });

  useEffect(() => {
    if (open) {
      setCategory({
        id: selectedProduct?.id || "",
        product: selectedProduct?.product || "",
        categoryId:params.product
      });
    }
  }, [open]);

  console.log(selectedProduct);

  const handleSave = async () => {
    try {
      if (product.id) {
        // Edit existing product
        const categoryRef = doc(db, "products", product.id);
        console.log(
          await updateDoc(categoryRef, { product: product.product,updatedAt: new Date(),  })
        );
        console.log("Products updated!");
        toast.success("Products Updated successfully!");
      } else {
        // Add new product
        const docRef = await addDoc(collection(db, "products"), {
          product: product.product,
          categoryId:product.categoryId,
          createdAt: new Date(), 
        });
        console.log("Products added with ID:", docRef.id);
        toast.success("Products Added successfully!");
      }
      // Close the dialog
      setCategory({ id: "", name: "" }); // Reset input
      setSelectedProduct({});
      setFetchData(true)
      setOpen(false);
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
        <Button variant="outline" className='bg-buttonBg text-white'>Add Product</Button>
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
              value={product.product}
              onChange={(e) => {
                setCategory((prev) => ({ ...prev, product: e.target.value }));
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
