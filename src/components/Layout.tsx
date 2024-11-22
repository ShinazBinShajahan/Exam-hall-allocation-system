import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState("John Doe");

  const handleLogout = () => {
    console.log("Logging out...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-700">
            Exam Hall Allocation System
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user}</span>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-blue-700 hover:text-white hover:bg-blue-700 border-blue-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
