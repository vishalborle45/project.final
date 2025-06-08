// components/Profile.jsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Mail, Key, Copy, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const ProfileComponent = ({ profile }) => {
  const [copyStatus, setCopyStatus] = useState({
    name: false,
    email: false,
    publicKey: false
  });

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

  // Handle copy to clipboard
  const handleCopy = (field) => {
    const textToCopy = profile?.[field] || "";
    navigator.clipboard.writeText(textToCopy).then(() => {
      // Set copy success status
      setCopyStatus(prev => ({ ...prev, [field]: true }));
      
      // Reset the success status after 2 seconds
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [field]: false }));
      }, 2000);
    });
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="h-full flex justify-center align-middle">
            <CardContent className="pt-6  text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={profile?.avatar} alt={profile?.name} />
                <AvatarFallback className="text-xl">
                  {getInitials(profile?.name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{profile?.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {profile?.email}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="text-lg font-medium">Profile Information</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <div className="flex items-center">
                    <div 
                      id="name"
                      className="rounded-md border border-input bg-background px-3 py-2 flex-grow"
                    >
                      {profile?.name || ""}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="ml-2" 
                      onClick={() => handleCopy("name")}
                      aria-label="Copy name"
                    >
                      {copyStatus.name ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <div className="flex items-center">
                    <div 
                      id="email"
                      className="rounded-md border border-input bg-background px-3 py-2 flex-grow"
                    >
                      {profile?.email || ""}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="ml-2" 
                      onClick={() => handleCopy("email")}
                      aria-label="Copy email"
                    >
                      {copyStatus.email ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="publicKey" className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4" />
                    Public Key
                  </Label>
                  <div className="flex items-center">
                    <div 
                      id="publicKey"
                      className="rounded-md border border-input bg-background px-3 py-2 flex-grow overflow-x-auto font-mono text-sm"
                    >
                      {profile?.publicKey || ""}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="ml-2" 
                      onClick={() => handleCopy("publicKey")}
                      aria-label="Copy public key"
                    >
                      {copyStatus.publicKey ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your public key is used for secure data transfer and cannot be changed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ProfileComponent;