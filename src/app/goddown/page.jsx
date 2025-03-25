"use client";

import { AddGoddown } from "@/components/goddown/AddGoddown";
import GoddownTable from "@/components/goddown/GoddownTable";
import { fetchGoddowns } from "@/store/slices/goddownSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const Goddown = () => {
  const [selectedGoddown , setSelectedGoddown ] = useState({});
  const [open, setOpen] = useState(false);
  
  const dispatch = useDispatch();
    const { goddowns, loading, error, fetched } = useSelector(
      (state) => state.goddowns
    );
  
    useEffect(() => {
      if (!fetched) dispatch(fetchGoddowns());
    }, []);

  return (
    <div className=" w-full p-4">
      <AddGoddown
        selectedGoddown ={selectedGoddown }
        setSelectedGoddown ={setSelectedGoddown }
        open={open}
        setOpen={setOpen}
      />
      <GoddownTable
        selectedGoddown ={selectedGoddown }
        setSelectedGoddown ={setSelectedGoddown }
        open={open}
        setOpen={setOpen}
        goddowns={goddowns}
      />
    </div>
  );
};

export default Goddown;
