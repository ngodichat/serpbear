import React from 'react';

type PaginatorProps = {
    currentPage: number,
    totalPages: number,
    onPageChange: Function
}

const Paginator = ({ currentPage, totalPages, onPageChange }: PaginatorProps) => {
  // Create an array with the page numbers to display
  const pagesArray = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center space-x-2">
      {/* Show Previous button if not on first page */}
      {currentPage > 1 && (
        <button onClick={() => onPageChange(currentPage - 1)}>
          Previous
        </button>
      )}

      {/* Show page numbers */}
      {pagesArray.map(pageNum => (
        <button
          key={pageNum}
          className={`hidden md:flex w-10 h-10 mx-1 justify-center items-center rounded-full border border-gray-200 hover:border-gray-300 ${
            pageNum === currentPage ? ' bg-blue-500 text-white' : ' bg-white text-black'
          }`}
          onClick={() => onPageChange(pageNum)}
        >
          {pageNum}
        </button>
      ))}

      {/* Show Next button if not on last page */}
      {currentPage < totalPages && (
        <button onClick={() => onPageChange(currentPage + 1)}>
          Next
        </button>
      )}
    </div>
  );
};

export default Paginator;
