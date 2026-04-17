// SeparatorWithIcon.tsx
import { Sparkles } from "lucide-react";

export function Separator() {
  return (
    <div className="relative my-16">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-muted-foreground/20" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-background px-4 text-muted-foreground/40">
          <Sparkles className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}