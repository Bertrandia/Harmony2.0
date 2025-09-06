// Shimmer for task cards only (larger size and more cards)
export default function TaskCardsShimmer() {
  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 hide-scrollbar">
      {[...Array(8)].map((_, idx) => (
        <div
          key={idx}
          className="h-24 w-full rounded-2xl bg-gray-200 animate-pulse"
        >
          {/* Optional: simulate inner card lines */}
          <div className="h-4 w-3/4 bg-gray-300 mt-3 ml-3 rounded"></div>
          <div className="h-3 w-1/2 bg-gray-300 mt-2 ml-3 rounded"></div>
        </div>
      ))}
    </div>
  );
}
