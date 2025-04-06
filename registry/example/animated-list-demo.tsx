"use client";

import { BellIcon, CompassIcon, MessageCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const notifications = [
  {
    icon: BellIcon,
    title: "New event",
    description: "Magic UI",
    time: "2m ago",
  },
  {
    icon: MessageCircleIcon,
    title: "New message",
    description: "Magic UI",
    time: "5m ago",
  },
  {
    icon: CompassIcon,
    title: "User signed up",
    description: "Magic UI",
    time: "10m ago",
  },
];

export default function AnimatedListDemo({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 overflow-hidden", className)}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BellIcon className="h-5 w-5" />
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Get notified when something happens.
        </p>
      </div>
      <div className="space-y-4">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className="group flex items-center gap-4 rounded-lg border p-4 transition-all hover:border-foreground/10 hover:bg-foreground/5"
          >
            <notification.icon className="h-5 w-5 text-foreground/70" />
            <div className="flex-1">
              <p className="text-sm font-medium leading-none">
                {notification.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {notification.description}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">{notification.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 