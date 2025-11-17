import React from 'react';

function Loader({ status = 'Analyzing article...' }) {
  return (
    <div className="flex justify-center items-center p-10">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin flex-shrink-0"></div>
      <p className="ml-4 text-sm text-gray-600">{status}</p>
    </div>
  );
}

export default Loader;