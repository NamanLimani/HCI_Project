import React from 'react';

function Loader() {
  return (
    <div className="flex justify-center items-center p-10">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin"></div>
      <p className="ml-4 font-sans text-muted-foreground">Analyzing article...</p>
    </div>
  );
}

export default Loader;