"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, Home, Building2, ClipboardList, LogOut } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [user, setUser] = useState({
    name: "John Doe",
    avatar: "/placeholder.svg",
  });

  const handleLogout = () => {
    console.log("Logging out...");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-10">
      <div className="container mx-auto px-4">
        {/* Top layer */}
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-700 rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-lg">EA</span>
            </div>
            <span className="text-xl font-bold text-blue-700">
              Exam Allocator
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-gray-700 hidden sm:inline">{user.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Bottom layer */}
        <div className={`lg:flex ${isMenuOpen ? "block" : "hidden"} py-2`}>
          <ul className="flex flex-col lg:flex-row lg:items-center lg:space-x-4">
            {[
              { name: "Home", href: "/", icon: Home },
              { name: "Manage Venues", href: "/venues", icon: Building2 },
              {
                name: "Previous Allocations",
                href: "/allocations",
                icon: ClipboardList,
              },
            ].map((item) => (
              <li key={item.name} className="py-2 lg:py-0">
                <Link
                  href={item.href}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 group"
                >
                  <item.icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
            <li className="py-2 lg:py-0">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full lg:w-auto justify-start text-gray-700 hover:bg-blue-100 hover:text-blue-700"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </Button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
