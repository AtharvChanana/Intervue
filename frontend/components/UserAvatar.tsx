"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api").replace(/\/api$/, "");

export function getProfileImageUrl(profilePictureUrl: string | null | undefined): string | undefined {
  if (!profilePictureUrl) return undefined;
  // Already a full URL (e.g. dicebear or external)
  if (profilePictureUrl.startsWith("http")) return profilePictureUrl;
  // Relative path from backend (e.g. /uploads/uuid_avatar.png)
  return `${BASE_URL}${profilePictureUrl}`;
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

interface UserAvatarProps {
  name?: string | null;
  profilePictureUrl?: string | null;
  className?: string;
  size?: "sm" | "default" | "lg";
  fallbackClassName?: string;
}

export default function UserAvatar({
  name,
  profilePictureUrl,
  className,
  size = "default",
  fallbackClassName,
}: UserAvatarProps) {
  const src = getProfileImageUrl(profilePictureUrl);
  const initials = getInitials(name);

  return (
    <Avatar
      size={size}
      className={cn(
        "shrink-0",
        size === "sm" && "size-7",
        size === "default" && "size-9",
        size === "lg" && "size-16",
        className
      )}
    >
      {src && (
        <AvatarImage
          src={src}
          alt={name ?? "User"}
          className="object-cover"
        />
      )}
      <AvatarFallback
        className={cn(
          "bg-zinc-800 text-zinc-300 font-bold uppercase text-xs tracking-wider",
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
