import React from "react";
import { Input } from "./ui/input";

const CustomInput = ({ value, onChange, className, placeholder,type }) => {
  return (
    <Input
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={onChange}
      className={"border-0 focus-visible:ring-0 " + className}
    />
  );
};

export default CustomInput;
