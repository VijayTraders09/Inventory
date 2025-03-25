"use client";
import { AddProduct } from "@/components/inventory/products/AddProduct";
import ProductTable from "@/components/inventory/products/ProductTable";
import { useParams } from "next/navigation";
import React, { useState } from "react";

const Products = () => {
  const [selectedProduct, setSelectedProduct] = useState({});
  const [open, setOpen] = useState(false);
  const params = useParams()
  const [fetchData, setFetchData] = useState(true);

  return (
    <div className=" w-full p-4">
      <AddProduct
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        open={open}
        setOpen={setOpen}
        fetchData={fetchData}
        setFetchData={setFetchData}
      />
      <ProductTable
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        open={open}
        setOpen={setOpen}
        fetchData={fetchData}
        setFetchData={setFetchData}
        categoryId={params?.categoryId}
      />
    </div>
  );
};

export default Products;
