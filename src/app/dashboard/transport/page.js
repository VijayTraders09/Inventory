"use client";
import { AddCategory } from "@/components/inventory/AddCategory";
import CategoryTable from "@/components/inventory/CategoryTable";
import { AddTransport } from "@/components/transport/AddTransport";
import TransportTable from "@/components/transport/TransportTable";
import React, { useState } from "react";

const page = () => {
  const [selectedTransport, setSelectedTransport] = useState({});
  const [open, setOpen] = useState(false);
  const [fetchData, setFetchData] = useState(true);

  return (
    <div className=" w-full p-4">
      <AddTransport
        selectedTransport={selectedTransport}
        setSelectedTransport={setSelectedTransport}
        open={open}
        setOpen={setOpen}
        fetchData={fetchData}
        setFetchData={setFetchData}
      />
      <TransportTable
        selectedTransport={selectedTransport}
        setSelectedTransport={setSelectedTransport}
        open={open}
        setOpen={setOpen}
        fetchData={fetchData}
        setFetchData={setFetchData}
      />
    </div>
  );
};

export default page;
