import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePreferences } from "@/app/context/preferences-context";

interface ArthurAvatarProps {
  size?: "sm" | "md" | "lg";
  showImage?: boolean;
  className?: string;
}

export function ArthurAvatar({ size = "md", showImage = true, className = "" }: ArthurAvatarProps) {
  const { preferences } = usePreferences();

  const getAvatarStyle = () => {
    if (preferences.chatColor) {
      return {
        backgroundColor: preferences.chatColor,
        color: '#e6e6e6',
        border: `1px solid ${preferences.chatColor}`
      };
    }
    return {
      backgroundColor: '#333',
      color: '#e6e6e6',
      border: '1px solid #333'
    };
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`} style={getAvatarStyle()}>
      {showImage && (
        <AvatarImage
          src="/Arthur-Ai-Logo.svg"
          alt="Arthur AI Assistant Avatar"
          width={size === "lg" ? 48 : size === "md" ? 40 : 32}
          height={size === "lg" ? 48 : size === "md" ? 40 : 32}
        />
      )}
      <AvatarFallback style={getAvatarStyle()}>Arthur</AvatarFallback>
    </Avatar>
  );
} 