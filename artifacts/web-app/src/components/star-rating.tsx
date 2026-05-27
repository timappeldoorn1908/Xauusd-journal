import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export function StarRating({ value, onChange, max = 5 }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            className={cn(
              "w-6 h-6 transition-colors",
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-zinc-600 hover:text-amber-400"
            )}
          />
        </button>
      ))}
    </div>
  );
}
