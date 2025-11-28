"use client";

import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { useUser } from "@stackframe/stack";

export function SignOutButton() {
  const user = useUser();

  const handleSignOut = async () => {
    await user?.signOut();
  };

  return (
    <Button
      onClick={handleSignOut}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  );
}
