"use client";
import React from "react";

import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function SelectDropdown({
  list = [],
  disabled,
  placeholder,
  className,
  value = 0,
  onChange,
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      className="border-2 border-red-400"
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          aria-expanded={open}
          className={className + "flex justify-between"}
        >
          {value
            ? list.find((option) => option.id === value)?.name
            : placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={className + 'p-0'}>
        <Command >
          <CommandInput placeholder={placeholder} className="h-9" />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {list.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name.toLowerCase()}
                  onSelect={(currentValue) => {
                    onChange(option.id === value ? "" : option.id);
                    setOpen(false);
                  }}
                >
                  {option.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === option.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default SelectDropdown;
