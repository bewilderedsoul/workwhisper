// src/components/ui/Avatar.tsx
import { cn, getInitials, generateAvatarColor } from "@/lib/utils";

interface AvatarProps {
  username: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

export function Avatar({ username, size = "md", className }: AvatarProps) {
  const initials = getInitials(username);
  const gradient = generateAvatarColor(username);

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white shrink-0 bg-gradient-to-br",
        gradient,
        sizeMap[size],
        className
      )}
      aria-label={username}
    >
      {initials}
    </div>
  );
}
