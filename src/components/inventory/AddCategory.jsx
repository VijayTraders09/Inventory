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
import { serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export function AddCategory({
  selectedCategory,
  open,
  setOpen,
  setSelectedCategory,
  setFetchData,
}) {
  const [category, setCategory] = useState({
    id: selectedCategory?.id || "",
    category: selectedCategory?.category || "",
  });

  useEffect(() => {
    if (open) {
      setCategory({
        id: selectedCategory?.id || "",
        category: selectedCategory?.category || "",
      });
    }
  }, [open]);

  console.log(selectedCategory);

  const handleSave = async () => {
    try {
      if (category.id) {
        // Edit existing category
        const categoryRef = doc(db, "categories", category.id);
        console.log(
          await updateDoc(categoryRef, {
            category: category.category,
            updatedAt: new Date(),
          })
        );
        console.log("Category updated!");
        toast.success("Category Updated successfully!");
      } else {
        // Add new category
        const docRef = await addDoc(collection(db, "categories"), {
          category: category.category,
          createdAt: new Date(),
        });
        console.log("Category added with ID:", docRef.id);
        toast.success("Category Added successfully!");
      }
      // Close the dialog
      setCategory({ id: "", name: "" }); // Reset input
      setSelectedCategory({});
      setFetchData(true);
      setOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
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
            Add Category
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-[555px]">
        <DialogHeader>
          <DialogTitle>
            {selectedCategory?.id ? "Update " : "New "} Category
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-5 items-center gap-2 ">
            <p htmlFor="name" className=" font-medium text-md col-span-2">
              Category Name :
            </p>
            <Input
              id="name"
              className="col-span-3"
              value={category.category}
              onChange={(e) => {
                setCategory((prev) => ({ ...prev, category: e.target.value }));
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
