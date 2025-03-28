"use client";

import { AddSeller } from "@/components/seller/AddSeller";
import CustomInput from "@/components/custom-input";
import ItemsTable from "@/components/items-table/ItemsTable";
import SelectDropdown from "@/components/select-dropdown";
import { Button } from "@/components/ui/button";
import { db } from "@/firebase/config";
import { fetchBuyer } from "@/store/slices/buyerSlice";
import { fetchCategories } from "@/store/slices/categorySlice";
import { fetchGoddowns } from "@/store/slices/goddownSlice";
import { fetchProductsByCategory } from "@/store/slices/productSlice";
import axios from "axios";
import { addDoc, collection } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchSeller } from "@/store/slices/sellerSlice";
import { GetPurchaseByInvoiceNumber } from "@/components/return-purchase/GetPurchaseByInvoiceNumber";
import ReturnPurchseItemsTable from "@/components/return-purchase/ReturnPurchseItemsTable";

const initialState = {
  seller: 0,
  goddown: 0,
  items: [],
  modeOfTransport: 0,
  invoice: "",
  remark: "",
};
export default function Home() {
  const transport = [
    {
      id: "1",
      name: "Car",
    },
    {
      id: "2",
      name: "Truck",
    },
    {
      id: "3",
      name: "Tempo",
    },
  ];

  const [items, setItems] = useState([]);
  const [item, setItem] = useState({
    categoryId: 0,
    productId: 0,
    quantity: 0,
  });

  const [purchase, setPurchase] = useState(initialState);

  const onChange = (value, name) => {
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const addItemsToList = () => {
    setItems((prev) => [
      ...prev,
      { ...item, idx: prev.length + 1, id: Math.round(Math.random() * 1000) },
    ]);
    setItem({
      categoryId: 0,
      productId: 0,
      quantity: 0,
    });
    setPurchase((prev) => ({
      ...prev,
      items: prev.items.map((row) => {
        if (row?._id === item._id) return item;
        return row;
      }),
    }));
  };

  const handleSave = async () => {
    if (!purchase.seller) {
      toast.error("Seller is required");
      return;
    }
    if (!purchase.goddown) {
      toast.error("Goddown is required");
      return;
    }
    if (!purchase?.items?.length) {
      toast.error("Item is required");
      return;
    }
    if (!purchase?.modeOfTransport) {
      toast.error("mode of transport is required");
      return;
    }
    if (!purchase?.invoice) {
      toast.error("Invoice is required");
      return;
    }
    try {
      const response = await axios.post("/api/return-purchase", {
        invoiceNumber: purchase.invoice,
        sellerId: purchase.seller, // ID of the seller
        items: purchase?.items,
        godownId: purchase.goddown, // ID of the godown where the product is stored
        modeOfTransport: purchase.modeOfTransport, // Mode of transport
        remark: purchase.remark, // Additional remarks
        purchaseInvoice: purchase.purchaseInvoice,
      });
      if (response.data.success) {
        setPurchase(initialState);
        setItems([]);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error.message.toString());
    } finally {
    }
  };

  const dispatch = useDispatch();

  const { sellers, fetched: fetchBuyerData } = useSelector(
    (state) => state.sellers
  );

  const { goddowns, fetched: fetchGoddownsData } = useSelector(
    (state) => state.goddowns
  );

  const { categories, fetched: fetchcategoryData } = useSelector(
    (state) => state.categories
  );
  const { products, fetched: fetchProductData } = useSelector(
    (state) => state.products
  );

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!fetchBuyerData) dispatch(fetchSeller());
    if (!fetchGoddownsData) dispatch(fetchGoddowns());
    if (!fetchcategoryData) dispatch(fetchCategories());
    dispatch(fetchProductsByCategory(""));
  }, []);

  useEffect(() => {
    if (item?.categoryId) dispatch(fetchProductsByCategory(item?.categoryId));
  }, [item]);

  // console.clear();
  console.log("item", item);

  return (
    <div className="w-full h-[100vh] flex flex-col items-center bg-bgGradient">
      <GetPurchaseByInvoiceNumber
        open={open}
        setOpen={setOpen}
        hideAddButton={true}
        setPurchase={setPurchase}
      />
      <div className="w-[calc(100vw-14rem)] ">
        <h1 className="text-start text-2xl font-medium mt-4">VJ Traders</h1>
      </div>
      <div className="w-[calc(100vw-20rem)] p-8 bg-gray-300 rounded-xl mt-4 shadow-xl">
        <div className="w-full flex items-center justify-between pb-2 border-b-2 border-b-grey">
          <h3 className="text-xl font-medium">Your Requirements</h3>
          <Button
            className=" bg-button-gradient"
            onClick={() => setOpen(true)}
          >
            Get Purchase Record
          </Button>
        </div>
        <div className="w-full mt-4 space-y-6 h-[30rem] overflow-auto">
          <div className="flex items-center justify-between w-full">
            <div>
              <p>Seller Name</p>
              <SelectDropdown
                list={sellers.map((seller) => ({
                  id: seller._id,
                  name: seller.sellerName,
                }))}
                disabled={true}
                label={"Select Seller"}
                value={purchase.seller}
                onChange={(value) =>
                  setPurchase((prev) => ({ ...prev, seller: value }))
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
                list={goddowns.map((goddown) => ({
                  id: goddown._id,
                  name: goddown.goddownName,
                }))}
                disabled={true}
                label={"Select Goddown"}
                value={purchase.goddown}
                onChange={(value) =>
                  setPurchase((prev) => ({ ...prev, goddown: value }))
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
                list={categories.map((category) => ({
                  id: category._id,
                  name: category.categoryName,
                }))}
                label={"Select Category"}
                value={item.categoryId}
                disabled={true}
                onChange={(value) => {
                  setItem((prev) => ({
                    ...prev,
                    categoryId: value,
                    categoryName: categories.find((cat) => cat._id == value)
                      .categoryName,
                  }));
                  dispatch(fetchProductsByCategory(value));
                }}
                placeholder={"Select"}
                className={
                  "w-[350px] border-0 focus-visible:ring-0 mt-2  bg-white rounded-md "
                }
              />
            </div>
            <div className="flex-3 w-full">
              <p>Product Name</p>
              <SelectDropdown
                list={products.map((product) => ({
                  id: product._id,
                  name: product.productName,
                }))}
                disabled={true}
                label={"Select Product"}
                value={item.productId}
                onChange={(value) => {
                  setItem((prev) => ({
                    ...prev,
                    productId: value,
                    productName: products.find((prod) => prod._id == value)
                      .productName,
                  }));
                }}
                placeholder={"Select"}
                className={
                  "w-[350px] border-0 focus-visible:ring-0 mt-2  bg-white rounded-md "
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
              Save Item
            </Button>
          </div>
          {purchase?.items?.length ? (
            <div className="flex items-center justify-between w-full">
              <ReturnPurchseItemsTable
                list={purchase.items}
                setItem={setItem}
              />
            </div>
          ) : (
            ""
          )}
          <div className="flex items-center justify-between w-full">
            <div>
              <p>Mode of Transport</p>
              <SelectDropdown
                list={transport.map((mode) => ({
                  id: mode.id,
                  name: mode.name,
                }))}
                label={"Select Mode of transport"}
                value={purchase.modeOfTransport}
                onChange={(value) => {
                  setPurchase((prev) => ({ ...prev, modeOfTransport: value }));
                }}
                placeholder={"Select"}
                className={
                  "w-[500px] border-0 focus-visible:ring-0 mt-2  bg-white rounded-md "
                }
              />
            </div>
            <div>
              <p>Purchase Invoice Number</p>
              <CustomInput
                value={purchase.invoice}
                type={"number"}
                placeholder={"Invoice"}
                onChange={(value) =>
                  setPurchase((prev) => ({
                    ...prev,
                    invoice: value.target.value,
                  }))
                }
                className={"w-[500px] border-0 mt-2  bg-white rounded-md "}
              />
            </div>
          </div>
          <div className="flex items-center justify-between w-full">
            <div>
              <p>Purchase Invoice Number</p>
              <CustomInput
                value={purchase.purchaseInvoice}
                type={"number"}
                disabled={true}
                placeholder={"Invoice"}
                className={"w-[500px] border-0 mt-2  bg-white rounded-md "}
              />
            </div>
            <div>
              <p>Remark</p>
              <CustomInput
                value={purchase.remark}
                type={"text"}
                multiline={true}
                placeholder={"Remark"}
                onChange={(value) =>
                  setPurchase((prev) => ({
                    ...prev,
                    remark: value.target.value,
                  }))
                }
                className={"w-[500px] border-0 mt-2  bg-white rounded-md "}
              />
            </div>
          </div>
          <div className="flex items-center justify-center w-full">
            <Button className=" bg-button-gradient" onClick={handleSave}>
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
