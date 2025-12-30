import { useState } from 'react';

export const useLoader = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);

  const toggleLoader = () => {
    setIsLoading((prev) => !prev);
  };

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return { isLoading, toggleLoader, startLoading, stopLoading };
};