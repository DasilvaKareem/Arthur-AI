import React from "react";
import dynamic from "next/dynamic";
import TopNavBar from "../../components/TopNavBar";
import ChatArea from "../../components/ChatArea";
import config from "../../config";
import ProtectedRoute from "../components/auth/protected-route";

const LeftSidebar = dynamic(() => import("../../components/LeftSidebar"), {
  ssr: false,
});
const RightSidebar = dynamic(() => import("../../components/RightSidebar"), {
  ssr: false,
});

export default function DashboardAppPage() {
  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen w-full bg-background text-foreground">
        <div className="particle particle1"></div>
        <div className="particle particle2"></div>
        <div className="particle particle3"></div>
        <div className="particle particle4"></div>
        <div className="particle particle5"></div>
        <div className="particle particle6"></div>
        <div className="particle particle7"></div>
        <div className="particle particle8"></div>
        <div className="particle particle9"></div>
        <TopNavBar />
        <div className="flex flex-1 overflow-hidden h-screen w-full">
          {config.includeLeftSidebar && <LeftSidebar />}
          <ChatArea />
          {config.includeRightSidebar && <RightSidebar />}
        </div>
      </div>
    </ProtectedRoute>
  );
} 