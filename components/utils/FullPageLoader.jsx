export default function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center">
      <div className="flex items-center space-x-6">
        <p className="text-white text-lg font-medium">
          Generating tasks, please wait...
        </p>
      </div>
    </div>
  );
}
