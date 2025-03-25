import React from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const CustomInput = ({
  value,
  onChange,
  className,
  placeholder,
  type,
  multiline,
}) => {
  return multiline ? (
    <Textarea
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={onChange}
      className={"border-0 focus-visible:ring-0 " + className}
    />
  ) : (
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
