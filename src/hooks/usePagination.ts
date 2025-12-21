import { useState, useMemo, useEffect } from 'react';
export interface PaginationResult<T> {
  currentData: T[];
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setItemsPerPage: (count: number) => void;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}
export function usePagination<T>(data: T[], initialItemsPerPage = 10): PaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  // Ensure current page is valid when data changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);
  // Reset to page 1 if data reference changes (e.g. filtering)
  // We use a ref or just dependency on data length/content if we want to be strict,
  // but for search/filter scenarios, usually the data array reference changes.
  // To avoid resetting on background refreshes that preserve order, we might need more complex logic.
  // For now, we'll rely on the user manually resetting if needed, or just bounds checking.
  // However, for search, it's better to reset.
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]); // Simple heuristic: if length changes, reset.
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);
  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data.length);
  return {
    currentData,
    currentPage,
    totalPages,
    goToPage,
    nextPage: () => goToPage(currentPage + 1),
    prevPage: () => goToPage(currentPage - 1),
    setItemsPerPage,
    startIndex,
    endIndex,
    totalItems: data.length
  };
}