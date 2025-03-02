import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

function SelectDropdown({
  list = [],
  label,
  placeholder,
  className,
  value = 0,
  onChange,
}) {
  return (
    <Select value={value} onValueChange={onChange}  className=" w-[300px]">
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={0}>{label}</SelectItem>
          {list.map((item, idx) => (
            <SelectItem key={idx} value={item.name}>
              {item.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default SelectDropdown;
