"use client";

import { AddGoddown } from "@/components/goddown/AddGoddown";
import GoddownTable from "@/components/goddown/GoddownTable";
import { Button } from "@/components/ui/button";
import { fetchGoddowns } from "@/store/slices/goddownSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const Goddown = () => {
  const [selectedGoddown, setSelectedGoddown] = useState({});
  const [open, setOpen] = useState(false);

  const dispatch = useDispatch();
  const { goddowns, loading, error, fetched } = useSelector(
    (state) => state.goddowns
  );

  useEffect(() => {
    if (!fetched) dispatch(fetchGoddowns());
  }, []);

  const exportExcel = async (data) => {
    try {
      const res = await fetch(`/api/goddown/export-all`);

      if (!res.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await res.blob(); // convert response into file blob
      const url = window.URL.createObjectURL(blob);

      // create a hidden <a> tag to download the file
      const a = document.createElement("a");
      a.href = url;
      a.download = `All-Goddown-data.xlsx`; // downloaded file name
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  return (
    <div className=" w-full p-4">
      <div className="flex justify-end items-center gap-2">
        <AddGoddown
          selectedGoddown={selectedGoddown}
          setSelectedGoddown={setSelectedGoddown}
          open={open}
          setOpen={setOpen}
        />
        <Button
          variant="ghost"
          className="bg-buttonBg text-white"
          onClick={exportExcel}
        >
          Export All
        </Button>
      </div>
      <GoddownTable
        selectedGoddown={selectedGoddown}
        setSelectedGoddown={setSelectedGoddown}
        open={open}
        setOpen={setOpen}
        goddowns={goddowns}
      />
    </div>
  );
};

export default Goddown;
