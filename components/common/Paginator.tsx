import React from 'react';

type PaginatorProps = {
  currentPage: number,
  totalPages: number,
  onPageChange: Function
}

const Paginator = ({ currentPage, totalPages, onPageChange }: PaginatorProps) => {
  const maxDisplayedPages = 10; // Set the maximum number of page buttons to display
  const halfMaxDisplayedPages = Math.floor(maxDisplayedPages / 2);

  // Calculate the range of pages to display
  const startPage = Math.max(currentPage - halfMaxDisplayedPages, 1);
  const endPage = Math.min(startPage + maxDisplayedPages - 1, totalPages);

  // Create an array with the page numbers to display
  const pagesArray = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className="flex justify-center space-x-2">
      {/* Show Previous button if not on first page */}
      {currentPage > 1 && (
        <>
          <button onClick={() => onPageChange(1)}>
            &lt;&lt;
          </button>
          <button onClick={() => onPageChange(currentPage - 1)}>
            Previous
          </button>
        </>
      )}

      {/* Show page numbers */}
      {pagesArray.map((pageNum) => (
        <button
          key={pageNum}
          className={`hidden md:flex w-10 h-10 mx-1 justify-center items-center rounded-full border border-gray-200 hover:border-gray-300 ${pageNum === currentPage ? ' bg-blue-500 text-white' : ' bg-white text-black'
            }`}
          onClick={() => onPageChange(pageNum)}
        >
          {pageNum}
        </button>
      ))}

      {/* Show Next button if not on last page */}
      {currentPage < totalPages && (
        <>
          <button onClick={() => onPageChange(currentPage + 1)}>
            Next
          </button>
          <button onClick={() => onPageChange(totalPages)}>
            &gt;&gt;
          </button>
        </>
      )}
    </div>
  );
};

export default Paginator;
