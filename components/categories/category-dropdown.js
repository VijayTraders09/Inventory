import { useMemo, useState } from "react";

export const CategorySearchableSelect = ({
  value,
  onChange,
  categories,
  disabled,
  className,
  placeholder,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories || [];

    return categories.filter((category) =>
      category.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const selectedCategory = useMemo(() => {
    if (!value || !categories) return null;
    return categories.find((category) => category._id === value);
  }, [value, categories]);

  return (
    <div className="relative">
      <div
        className={`flex h-9 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedCategory ? selectedCategory.categoryName : placeholder}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2">
            <input
              type="text"
              className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="py-1">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <li
                  key={category._id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    onChange(category._id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  {category.categoryName}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-500">No categories found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};