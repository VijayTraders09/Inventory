"use client";
import { AddCategory } from "@/components/inventory/AddCategory";
import CategoryTable from "@/components/inventory/CategoryTable";
import React, { useState } from "react";

const page = () => {
  const [selectedCategory, setSelectedCategory] = useState({});
  const [open, setOpen] = useState(false);
  const [fetchData, setFetchData] = useState(true);

  return (
    <div className=" w-full p-4">
      <AddCategory
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        open={open}
        setOpen={setOpen}
        fetchData={fetchData}
        setFetchData={setFetchData}
      />
      <CategoryTable
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        open={open}
        setOpen={setOpen}
        fetchData={fetchData}
        setFetchData={setFetchData}
      />
    </div>
  );
};

export default page;
