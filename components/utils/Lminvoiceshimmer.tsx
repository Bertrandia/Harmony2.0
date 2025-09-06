import React from 'react';

const Lminvoiceshimmer = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <div className="h-5 bg-gray-300 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="h-4 bg-gray-300 rounded w-40 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-56 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-72"></div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-300 rounded w-48"></div>
        <div className="h-4 bg-gray-300 rounded w-36"></div>
      </div>
      
      <div className="flex justify-end">
        <div className="h-8 bg-gray-300 rounded w-24"></div>
      </div>
    </div>
  );
};

export default Lminvoiceshimmer;