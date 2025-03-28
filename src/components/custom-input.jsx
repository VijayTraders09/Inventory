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
  disabled,
}) => {
  return multiline ? (
    <Textarea
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={onChange}
      disabled={disabled}
      className={"border-0 focus-visible:ring-0 " + className}
    />
  ) : (
    <Input
      disabled={disabled}
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={onChange}
      className={"border-0 focus-visible:ring-0 " + className}
    />
  );
};

export default CustomInput;
