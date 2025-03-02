"use client";

import CustomInput from "@/components/custom-input";
import ItemsTable from "@/components/items-table/ItemsTable";
import SelectDropdown from "@/components/select-dropdown";
import { Button } from "@/components/ui/button";
import { db } from "@/firebase/config";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import { toast } from "react-toastify";

export default function Home() {
  const customers = [
    {
      id: 1,
      name: "Ram",
    },
    {
      id: 2,
      name: "Sham",
    },
    {
      id: 3,
      name: "Sanket",
    },
    {
      id: 4,
      name: "Vaibhav",
    },
  ];
  const Goddown = [
    {
      id: 1,
      name: "Warehouse 1",
    },
    {
      id: 2,
      name: "Warehouse 2",
    },
    {
      id: 3,
      name: "Warehouse 3",
    },
    {
      id: 4,
      name: "Warehouse 4",
    },
  ];

  const products = [
    {
      id: 1,
      name: "Ashirvaad Ata 1kG",
    },
    {
      id: 2,
      name: "Sunflower Oi 1ltr",
    },
    {
      id: 3,
      name: "Fortune Oil 1ltr",
    },
    {
      id: 4,
      name: "Lajjat Papad 1Kg",
    },
  ];

  const categories = [
    {
      id: 1,
      name: "Atta",
    },
    {
      id: 2,
      name: "Oil",
    },
    {
      id: 3,
      name: "Papad",
    },
  ];

  const transport = [
    {
      id: 1,
      name: "Car",
    },
    {
      id: 2,
      name: "Truck",
    },
    {
      id: 3,
      name: "Tempo",
    },
  ];

  const [items, setItems] = useState([]);
  const [item, setItem] = useState({
    category: 0,
    product: 0,
    quantity: 0,
  });

  const [sale, setSale] = useState({
    customer: 0,
    goddown: 0,
    items: [],
    modeOfTransport: 0,
    invoice: "",
  });

  const onChange = (value, name) => {
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const addItemsToList = () => {
    setItems((prev) => [
      ...prev,
      { ...item, idx: prev.length + 1, id: Math.round(Math.random() * 1000) },
    ]);
    setItem({
      category: 0,
      product: 0,
      quantity: 0,
    })
  };

  const handleSave = async () => {
    try {
      const docRef = await addDoc(collection(db, "sales"), {
        ...sale,
        items:items,
        createdAt: new Date(),
      });
      console.log("Sale added with ID:", docRef.id);
      toast.success("Sale Added successfully!");
      // Close the dialog
      setSale({
        customer: "",
        goddown: "",
        items: [],
        modeOfTransport: "",
        invoice: "",
      }); 
      setItems([])
      // Reset input
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(error.message.toString());
    }
  };

  console.log(item);
  console.log(items);
  return (
    <div className="w-full h-[100vh] flex flex-col items-center bg-bgGradient">
      <div className="w-[calc(100vw-14rem)] ">
        <h1 className="text-start text-2xl font-medium mt-4">VJ Traders</h1>
      </div>
      <div className="w-[calc(100vw-20rem)] p-8 bg-gray-300 rounded-xl mt-4 shadow-xl">
        <div className="w-full flex items-center justify-between pb-2 border-b-2 border-b-grey">
          <h3 className="text-xl font-medium">Your Requirements</h3>
          <Button className=" bg-button-gradient">Add New Customer</Button>
        </div>
        <div className="w-full mt-4 space-y-6 h-[30rem] overflow-auto">
          <div className="flex items-center justify-between w-full">
            <div>
              <p>Customer Name</p>
              <SelectDropdown
                list={customers}
                label={"Select Customer"}
                value={sale.customer}
                onChange={(value) =>
                  setSale((prev) => ({ ...prev, customer: value }))
                }
                placeholder={"Select"}
                className={
                  "w-[500px] border-0 focus-visible:ring-0 mt-2  bg-white rounded-md "
                }
              />
            </div>
            <div>
              <p>Select Goddown</p>
              <SelectDropdown
                list={Goddown}
                label={"Select Goddown"}
                value={sale.goddown}
                onChange={(value) =>
                  setSale((prev) => ({ ...prev, goddown: value }))
                }
                placeholder={"Select"}
                className={
                  "w-[500px] border-0 focus-visible:ring-0 mt-2  bg-white rounded-md "
                }
              />
            </div>
          </div>
          <div className="flex items-end justify-between w-full gap-2">
            <div className="flex-3 w-full">
              <p>Category Name</p>
              <SelectDropdown
                list={categories}
                label={"Select Category"}
                value={item.category}
                onChange={(value) => onChange(value, "category")}
                placeholder={"Select"}
                className={
                  "w-full border-0 focus-visible:ring-0 mt-2  bg-white rounded-md "
                }
              />
            </div>
            <div className="flex-3 w-full">
              <p>Product Name</p>
              <SelectDropdown
                list={products}
                label={"Select Product"}
                value={item.product}
                onChange={(value) => onChange(value, "product")}
                placeholder={"Select"}
                className={
                  "w-full border-0 focus-visible:ring-0 mt-2  bg-white rounded-md "
                }
              />
            </div>
            <div className="flex-3 w-full">
              <p>Quantity</p>
              <CustomInput
                value={item.quantity}
                onChange={(value) =>
                  onChange(parseInt(value.target.value || 0), "quantity")
                }
                type={"number"}
                placeholder={"Quantity"}
                className={"w-full border-0 mt-2  bg-white rounded-md "}
              />
            </div>
            <Button
              onClick={addItemsToList}
              className="flex-2 bg-button-gradient"
            >
              Add Item
            </Button>
          </div>
          {items.length ? (
            <div className="flex items-center justify-between w-full">
              <ItemsTable list={items} setList={setItems} />
            </div>
          ) : (
            ""
          )}
          <div className="flex items-center justify-between w-full">
            <div>
              <p>Mode of Transport</p>
              <SelectDropdown
                list={transport}
                label={"Select Mode of transport"}
                value={sale.transport}
                onChange={(value) =>
                  setSale((prev) => ({ ...prev, transport: value }))
                }
                placeholder={"Select"}
                className={
                  "w-[500px] border-0 focus-visible:ring-0 mt-2  bg-white rounded-md "
                }
              />
            </div>
            <div>
              <p>Invoice Number</p>
              <CustomInput
                value={sale.invoice}
                type={"number"}
                placeholder={"Invoice"}
                onChange={(value) =>
                  setSale((prev) => ({ ...prev, invoice: value.target.value }))
                }
                className={"w-[500px] border-0 mt-2  bg-white rounded-md "}
              />
            </div>
          </div>
          <div className="flex items-center justify-center w-full">
            <Button className=" bg-button-gradient" onClick={handleSave}>Submit</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
