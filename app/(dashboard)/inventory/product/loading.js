export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      <div className="flex gap-4">
        <div className="h-10 w-96 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-200 h-24 rounded animate-pulse"></div>
        <div className="bg-gray-200 h-24 rounded animate-pulse"></div>
        <div className="bg-gray-200 h-24 rounded animate-pulse"></div>
        <div className="bg-gray-200 h-24 rounded animate-pulse"></div>
      </div>
      
      <div className="bg-gray-200 h-96 rounded animate-pulse"></div>
    </div>
  );
}