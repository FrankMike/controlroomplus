export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[200px]">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-blue-200"></div>
        <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
    </div>
  );
} 