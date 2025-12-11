"use client";

import CustomInput from "@/components/custom-input";
import SelectDropdown from "@/components/select-dropdown";
import { Button } from "@/components/ui/button";
import { fetchGoddowns } from "@/store/slices/goddownSlice";
import { fetchProductsByGoddown } from "@/store/slices/productsByGoddown";
import { updatePurchaseFetched } from "@/store/slices/purchaseSlice";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

const initialState = {
  fromGodown: "",
  toGodown: "",
  productId: "",
  quantity: 0,
  remark: "",
  availableQuantity: 0,
};
export default function Home() {
  const [transfer, setTransfer] = useState(initialState);
  const handleSave = async () => {
    if (!transfer?.fromGodown) {
      toast.error("1st Goddown is required");
      return;
    }
    if (!transfer?.toGodown) {
      toast.error("2nd Goddown is required");
      return;
    }
    if (transfer.fromGodown === transfer.toGodown) {
      toast.error("Both goddowns are same");
      return;
    }
    if (!transfer?.productId) {
      toast.error("Product is required");
      return;
    }
    if (!transfer?.quantity) {
      toast.error("Quantity is required");
      return;
    }
    if (transfer?.quantity > transfer.availableQuantity) {
      toast.error("Quantity is more than available quantity");
      return;
    }

    try {
      const response = await axios.post(
        "api/goddown/transfer-godown",
        transfer
      );
      if (response.data.success) {
        setTransfer(initialState);
        toast.success(response.data.message);
        dispatch(updatePurchaseFetched(false));
        // if (data?._id) navigate.replace("/dashboard/purchases");
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
  const { goddowns, fetched: fetchGoddownsData } = useSelector(
    (state) => state.goddowns
  );

  const { products: productsByGoddown, fetched: fetchProductsByGoddownData } =
    useSelector((state) => state.productsByGoddown);

  useEffect(() => {
    if (!fetchGoddownsData) dispatch(fetchGoddowns());
  }, []);

  useEffect(() => {
    if (transfer.fromGodown) {
      dispatch(fetchProductsByGoddown(transfer.fromGodown));
      setTransfer((prev) => ({ ...prev, productId: "" }));
    }
  }, [transfer.fromGodown]);

  useEffect(() => {
    if (transfer.productId) {
      let product = productsByGoddown.find(
        (product) => product._id === transfer.productId
      );
      let quantity = 0;
      product?.quantity.forEach((item) => {
        if (item.godownId === transfer.fromGodown) {
          quantity = item.quantity;
        }
      });
      setTransfer((prev) => ({ ...prev, availableQuantity: quantity }));
    }
  }, [transfer.productId]);

  return (
    <div className="w-full h-[100vh] flex flex-col items-center bg-bgGradient">
      <div className="w-[calc(100vw-14rem)] ">
        <h1 className="text-start text-2xl font-medium mt-4">VJ Traders</h1>
      </div>
      <div className="w-[calc(100vw-16rem)] p-8 bg-gray-300 rounded-xl mt-4 shadow-xl">
        <div className="w-full flex items-center justify-between pb-2 border-b-2 border-b-grey">
          <h3 className="text-xl font-medium">
            Your Requirements ( Transfer )
          </h3>
        </div>
        <div className="w-full mt-4 space-y-6 h-[30rem] overflow-auto">
          <div className="flex items-center justify-between w-full">
            <div>
              <p>Select 1st Goddown</p>
              <SelectDropdown
                list={goddowns.map((goddown) => ({
                  id: goddown._id,
                  name: goddown.goddownName,
                }))}
                label={"Select Goddown"}
                value={transfer.fromGodown}
                onChange={(value) =>
                  setTransfer((prev) => ({ ...prev, fromGodown: value }))
                }
                placeholder={"Select"}
                className={
                  "w-[500px] border-0 focus-visible:ring-0 mt-2  bg-white rounded-md "
                }
              />
            </div>
            <div>
              <p>Select 2nd Goddown</p>
              <SelectDropdown
                list={goddowns.map((goddown) => ({
                  id: goddown._id,
                  name: goddown.goddownName,
                }))}
                label={"Select Goddown"}
                value={transfer.toGodown}
                onChange={(value) =>
                  setTransfer((prev) => ({ ...prev, toGodown: value }))
                }
                placeholder={"Select"}
                className={
                  "w-[500px] border-0 focus-visible:ring-0 mt-2  bg-white rounded-md "
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between w-full">
            <div>
              <p>Select Product</p>
              <SelectDropdown
                list={productsByGoddown.map((product) => ({
                  id: product._id,
                  name: product.productName,
                }))}
                label={"Select Product"}
                value={transfer.productId}
                onChange={(value, product) => {
                  setTransfer((prev) => ({
                    ...prev,
                    productId: value,
                  }));
                }}
                placeholder={"Select"}
                className={
                  "w-[500px] border-0 focus-visible:ring-0 mt-2  bg-white rounded-md "
                }
              />
            </div>
            <div>
              <p>{`Quantity ${
                transfer?.availableQuantity
                  ? `: ${transfer.availableQuantity}`
                  : ""
              }`}</p>
              <CustomInput
                value={transfer.quantity}
                onChange={(value) =>
                  setTransfer((prev) => ({
                    ...prev,
                    quantity: Number(value.target.value),
                  }))
                }
                type={"number"}
                placeholder={"Quantity"}
                className={"w-[500px] border-0 mt-2  bg-white rounded-md "}
              />
            </div>
          </div>
          <div className="flex items-center justify-between w-full">
            <div className="w-full">
              <p>Remark</p>
              <CustomInput
                value={transfer.remark}
                type={"text"}
                multiline={true}
                placeholder={"Remark"}
                onChange={(value) =>
                  setTransfer((prev) => ({
                    ...prev,
                    remark: value.target.value,
                  }))
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
