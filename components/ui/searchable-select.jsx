"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

const AsyncSearchableSelect = ({
  value,
  onChange,
  placeholder = "Search...",
  emptyMessage = "No results found",
  searchEndpoint,
  searchParam = "search",
  valueField = "_id",
  labelField = "name",
  className,
  disabled = false,
  initialOptions = [],
  minSearchLength = 2,
  debounceMs = 300,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState(initialOptions);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const dropdownRef = useRef(null);
  const contentRef = useRef(null);

  // Debounce function to limit API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(null, args);
      }, delay);
    };
  };

  // Function to fetch options
  const fetchOptions = useCallback(
    async (term, pageNum = 1, reset = false) => {
      if (!term && term !== "" && minSearchLength > 0) return;
      
      setLoading(true);
      try {
        const params = new URLSearchParams({
          [searchParam]: term,
          page: pageNum.toString(),
          limit: "20", // Limit to 20 results per page
        });
        
        const response = await axios.get(`${searchEndpoint}?${params}`);
        
        if (response.data.success) {
          const newOptions = response.data.data;
          
          if (reset) {
            setOptions(newOptions);
          } else {
            setOptions((prev) => [...prev, ...newOptions]);
          }
          
          setHasMore(
            response.data.pagination.page < response.data.pagination.pages
          );
        }
      } catch (error) {
        console.error("Error fetching options:", error);
      } finally {
        setLoading(false);
      }
    },
    [searchEndpoint, searchParam, minSearchLength]
  );

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(fetchOptions, debounceMs),
    [fetchOptions, debounceMs]
  );

  // Initial load and search effect
  useEffect(() => {
    if (searchTerm.length >= minSearchLength || searchTerm === "") {
      setPage(1);
      fetchOptions(searchTerm, 1, true);
    }
  }, [searchTerm, fetchOptions, minSearchLength]);

  // Set selected option when value changes
  useEffect(() => {
    if (value && options.length > 0) {
      const option = options.find((opt) => opt[valueField] === value);
      setSelectedOption(option);
    } else {
      setSelectedOption(null);
    }
  }, [value, options, valueField]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle scroll in dropdown for infinite scrolling
  const handleScroll = () => {
    if (!contentRef.current || !hasMore || loading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setPage((prev) => prev + 1);
      fetchOptions(searchTerm, page + 1, false);
    }
  };

  // Handle option selection
  const handleSelectOption = (option) => {
    onChange(option[valueField]);
    setSelectedOption(option);
    setIsOpen(false);
  };

  // Handle clearing selection
  const handleClearSelection = () => {
    onChange("");
    setSelectedOption(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between w-full">
          <div className="truncate">
            {selectedOption ? selectedOption[labelField] : placeholder}
          </div>
          <div className="flex items-center">
            {selectedOption && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearSelection();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 sticky top-0 bg-background z-10 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div
            ref={contentRef}
            className="overflow-y-auto max-h-48"
            onScroll={handleScroll}
          >
            {options.length === 0 && !loading && (
              <div className="p-2 text-center text-gray-500">
                {searchTerm.length < minSearchLength
                  ? `Type at least ${minSearchLength} characters to search`
                  : emptyMessage}
              </div>
            )}
            
            {options.map((option) => (
              <div
                key={option[valueField]}
                className={cn(
                  "px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground",
                  selectedOption && selectedOption[valueField] === option[valueField] && "bg-accent"
                )}
                onClick={() => handleSelectOption(option)}
              >
                {option[labelField]}
              </div>
            ))}
            
            {loading && (
              <div className="p-2 text-center text-gray-500">
                Loading...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AsyncSearchableSelect;