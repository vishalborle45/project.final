import React, { useState, useEffect } from "react";
import { getProfile } from "../services/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { User, Upload, Download, Share, Menu, X } from "lucide-react";

// Import basic shadcn components that are likely available
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Import component for each section
import UploadComponent from "./components/UploadComponent";
import RetrieveComponent from "./components/RetrieveComponent";
import SharedComponent from "./components/SharedComponent";
import ProfileComponent from "./components/ProfileComponent";
import HomeComponent from "./components/HomeComponent.jsx";

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState("home");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        setProfile(response.data.user);
      } catch (err) {
        setError("Failed to load profile");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Check for mobile view
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle navigation click
  const handleNavClick = (component, closeSidebar) => {
    setActiveComponent(component);
    if (closeSidebar) {
      closeSidebar();
    }
  };

  // Create a simple sidebar navigation item component
  const NavItem = ({ component, icon, children, onClick }) => (
    <button
      className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left ${
        activeComponent === component ? "bg-accent text-accent-foreground" : ""
      }`}
      onClick={() => handleNavClick(component, onClick)}
    >
      {icon}
      <span>{children}</span>
    </button>
  );

  // Render the active component
  const renderComponent = () => {
    switch (activeComponent) {
      case "upload":
        return <UploadComponent />;
      case "retrieve":
        return <RetrieveComponent />;
      case "shared":
        return <SharedComponent />;
      case "profile":
        return <ProfileComponent profile={profile} />;
      case "home":
      default:
        return <HomeComponent profile={profile} />;
    }
  };

  // Sidebar content that will be used in both mobile and desktop views
  const sidebarContent = (closeSidebar) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        {isMobile && (
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </SheetClose>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-2">
        <div className="space-y-1">
          <NavItem
            component="home"
            icon={<User className="w-4 h-4" />}
            onClick={closeSidebar}
          >
            Home
          </NavItem>
          <NavItem
            component="upload"
            icon={<Upload className="w-4 h-4" />}
            onClick={closeSidebar}
          >
            Upload
          </NavItem>
          <NavItem
            component="retrieve"
            icon={<Download className="w-4 h-4" />}
            onClick={closeSidebar}
          >
            Retrieve
          </NavItem>
          <NavItem
            component="shared"
            icon={<Share className="w-4 h-4" />}
            onClick={closeSidebar}
          >
            Shared With You
          </NavItem>
        </div>
      </div>

      {/* Footer - Simplified Profile */}
      <div className="px-3 py-4 mt-auto border-t">
        <button
          className={`flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left ${
            activeComponent === "profile"
              ? "bg-accent text-accent-foreground"
              : ""
          }`}
          onClick={() => handleNavClick("profile", closeSidebar)}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar} alt={profile?.name || "User"} />
            <AvatarFallback>{getInitials(profile?.name)}</AvatarFallback>
          </Avatar>
          <span>{profile?.name || "Profile"}</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto flex h-screen">
        <div className="w-64 border-r p-4">
          <Skeleton className="h-8 w-40 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-12 w-3/4 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto flex justify-center items-center h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const closeSidebar = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
    <div className="container mx-auto flex h-full overflow-hidden">
      {/* For desktop: fixed sidebar */}
      {!isMobile && (
        <div className="w-64 border-r bg-background">
          {sidebarContent(() => {})}
        </div>
      )}

      {/* For mobile: collapsible sidebar */}
      {isMobile && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden absolute top-4 left-4 z-10"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            {sidebarContent(closeSidebar)}
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">{renderComponent()}</div>
      </div>
    </div>
  );
};

export default Dashboard;