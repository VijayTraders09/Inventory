"use client";

import { AddBuyer } from "@/components/buyer/AddBuyer";
import CustomInput from "@/components/custom-input";
import ItemsTable from "@/components/items-table/ItemsTable";
import SelectDropdown from "@/components/select-dropdown";
import { AddTransport } from "@/components/transport/AddTransport";
import { Button } from "@/components/ui/button";
import { fetchBuyer } from "@/store/slices/buyerSlice";
import { fetchCategories } from "@/store/slices/categorySlice";
import { fetchGoddowns } from "@/store/slices/goddownSlice";
import { fetchProductsByCategory } from "@/store/slices/productSlice";
import { fetchTransport } from "@/store/slices/transportSlice";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

const initialState = {
  customer: 0,
  goddown: 0,
  items: [],
  modeOfTransport: 0,
  invoice: "",
  remark: "",
};
export default function Home() {
  const dispatch = useDispatch();

  const { buyers, fetched: fetchBuyerData } = useSelector(
    (state) => state.buyers
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
  const {
    transports,
    loading,
    error,
    fetched: fetchTransportData,
  } = useSelector((state) => state.transports);

  const [items, setItems] = useState([]);
  const [item, setItem] = useState({
    categoryId: 0,
    productId: 0,
    quantity: 0,
  });

  const [sale, setSale] = useState(initialState);
  const [openAddTransport, setOpenAddTransport] = useState(false);

  const onChange = (value, name) => {
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const addItemsToList = () => {
    if (!item.categoryId) {
      toast.error("Category is required");
      return;
    }
    if (!item.productId) {
      toast.error("Product is required");
      return;
    }
    if (!item?.godownId) {
      toast.error("Goddown is required");
      return;
    }
    if (!item?.quantity) {
      toast.error("quantity is required");
      return;
    }

    // let selectedGoddown = goddowns.find(
    //   (goddown) => goddown._id === item.godownId
    // );
    // selectedGoddown?.stock.forEach((goddown) => {
    //   if (goddown.productId === item.productId) {
    //     if (!(Number(goddown.quantity) > Number(item.quantity))) {
    //       toast.error(item?.goddownName+" has "+goddown.quantity+" "+item?.productName );
    //       return
    //     }
    //   }
    // });
    setItems((prev) => [
      ...prev,
      { ...item, idx: prev.length + 1, id: Math.round(Math.random() * 1000) },
    ]);
    setItem({
      categoryId: 0,
      productId: 0,
      quantity: 0,
    });
  };

  const handleSave = async () => {
    if (!sale.customer) {
      toast.error("Customer is required");
      return;
    }
    if (!items?.length) {
      toast.error("Item is required");
      return;
    }
    if (!sale?.modeOfTransport) {
      toast.error("mode of transport is required");
      return;
    }

    try {
      const response = await axios.post("/api/sell", {
        invoiceNumber: sale.invoice,
        buyerId: sale.customer, // ID of the buyer
        items: items,
        godownId: sale.goddown, // ID of the godown where the product is stored
        modeOfTransport: sale.modeOfTransport, // Mode of transport
        remark: sale.remark, // Additional remarks
      });
      if (response.data.success) {
        setSale(initialState);
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

  const [openCustomer, setOpenCustomer] = useState(false);

  useEffect(() => {
    if (!fetchBuyerData) dispatch(fetchBuyer());
    if (!fetchGoddownsData) dispatch(fetchGoddowns());
    if (!fetchcategoryData) dispatch(fetchCategories());
    if (!fetchTransportData) dispatch(fetchTransport());
    dispatch(fetchProductsByCategory(""));
  }, []);

  // console.clear();
  console.log(sale);

  return (
    <div className="w-full h-[100vh] flex flex-col items-center bg-bgGradient">
      <AddBuyer
        open={openCustomer}
        setOpen={setOpenCustomer}
        hideAddButton={true}
      />
      <div className="w-[calc(100vw-14rem)] ">
        <h1 className="text-start text-2xl font-medium mt-4">VJ Traders</h1>
      </div>
      <div className="w-[calc(100vw-16rem)] p-8 bg-gray-300 rounded-xl mt-4 shadow-xl">
        <div className="w-full flex items-center justify-between pb-2 border-b-2 border-b-grey">
          <h3 className="text-xl font-medium">Your Requirements ( Sale )</h3>
          <Button
            className=" bg-button-gradient"
            onClick={() => setOpenCustomer(true)}
          >
            Add New Customer
          </Button>
        </div>
        <div className="w-full mt-4 space-y-6 h-[30rem] overflow-auto">
          <div className="flex items-center justify-between w-full">
            <div>
              <p>Customer Name</p>
              <SelectDropdown
                list={buyers.map((buyer) => ({
                  id: buyer._id,
                  name: buyer.buyerName,
                }))}
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
              <p>Invoice Number</p>
              <CustomInput
                value={sale.invoice}
                type={"number"}
                placeholder={"Invoice"}
                onChange={(value) =>
                  setSale((prev) => ({
                    ...prev,
                    invoice: value.target.value,
                  }))
                }
                className={"w-[500px] border-0 mt-2  bg-white rounded-md "}
              />
            </div>
          </div>
          <div className="flex items-end justify-between w-full gap-2">
            <div className="flex-3 w-full">
              <p>Select Category</p>
              <SelectDropdown
                list={categories.map((category) => ({
                  id: category._id,
                  name: category.categoryName,
                }))}
                label={"Select Category"}
                value={item.categoryId}
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
                  "w-[17rem] border-0 focus-visible:ring-0 mt-2  bg-white rounded-md "
                }
              />
            </div>
            <div className="flex-3 w-full">
              <p>Select Product</p>
              <SelectDropdown
                list={products.map((product) => ({
                  id: product._id,
                  name: product.productName,
                }))}
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
                  "w-[17rem] border-0 focus-visible:ring-0 mt-2  bg-white rounded-md "
                }
              />
            </div>
            <div className="flex-3 w-full">
              <p>Select Goddown</p>
              <SelectDropdown
                list={goddowns.map((goddown) => ({
                  id: goddown._id,
                  name: goddown.goddownName,
                }))}
                label={"Select Goddown"}
                value={item.godownId}
                onChange={(value) => {
                  setItem((prev) => ({
                    ...prev,
                    godownId: value,
                    goddownName: goddowns.find((prod) => prod._id == value)
                      ?.goddownName,
                  }));
                }}
                placeholder={"Select"}
                className={
                  "w-[17rem] border-0 focus-visible:ring-0 mt-2  bg-white rounded-md "
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
                className={"w-[14rem] border-0 mt-2  bg-white rounded-md "}
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
          <div className="flex items-end gap-2 w-full">
            <div>
              <p>Mode of Transport</p>
              <SelectDropdown
                list={transports.map((mode) => ({
                  id: mode.transport,
                  name: mode.transport,
                }))}
                label={"Select Mode of transport"}
                value={sale.modeOfTransport}
                onChange={(value) => {
                  setSale((prev) => ({ ...prev, modeOfTransport: value }));
                }}
                placeholder={"Select"}
                className={
                  "w-[500px] border-0 focus-visible:ring-0 mt-2  bg-white rounded-md "
                }
              />
            </div>
            <div>
              <AddTransport
                open={openAddTransport}
                setOpen={setOpenAddTransport}
              />
            </div>
          </div>
          <div className="flex items-center justify-between w-full">
            <div className="w-full">
              <p>Remark</p>
              <CustomInput
                value={sale.remark}
                type={"text"}
                multiline={true}
                placeholder={"Remark"}
                onChange={(value) =>
                  setSale((prev) => ({ ...prev, remark: value.target.value }))
                }
                className={"w-[100%] border-0 mt-2  bg-white rounded-md "}
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
