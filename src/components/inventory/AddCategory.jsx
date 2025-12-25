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
import { fetchCategories } from "@/store/slices/categorySlice";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

export function AddCategory({
  selectedCategory,
  open,
  setOpen,
  setSelectedCategory,
  setFetchData,
}) {
  const dispatch = useDispatch();
  const [category, setCategory] = useState({
    id: selectedCategory?._id || "",
    categoryName: selectedCategory?.categoryName || "",
  });

  useEffect(() => {
    if (open) {
      setCategory({
        id: selectedCategory?._id || "",
        categoryName: selectedCategory?.categoryName || "",
      });
    }
  }, [open, selectedCategory]);

  const handleSave = async () => {
    try {
      const response = await axios.post("/api/category", category);
      if (response.data.success) {
        if (selectedCategory?._id)
          toast.success("Category Updated successfully!");
        else toast.success("Category Added successfully!");
        setCategory({ id: "", name: "" }); // Reset input
        setSelectedCategory({});
        dispatch(fetchCategories());
        setOpen(false);
      } else {
        toast.error(response.data.message);
      }
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
            {selectedCategory?._id ? "Update " : "New "} Category
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
              value={category.categoryName}
              onChange={(e) => {
                setCategory((prev) => ({
                  ...prev,
                  categoryName: e.target.value,
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
