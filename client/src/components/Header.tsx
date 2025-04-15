import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-primary text-3xl mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </span>
          <h1 className="text-xl font-semibold text-gray-900">MoveEase</h1>
        </div>
        <nav className="hidden md:block">
          <ul className="flex space-x-8">
            <li><a href="#" className="text-gray-700 hover:text-primary font-medium">How It Works</a></li>
            <li><a href="#" className="text-gray-700 hover:text-primary font-medium">Services</a></li>
            <li><a href="#" className="text-gray-700 hover:text-primary font-medium">Reviews</a></li>
            <li><a href="#" className="text-gray-700 hover:text-primary font-medium">Contact</a></li>
          </ul>
        </nav>
        <MobileMenu />
      </div>
    </header>
  );
}

function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="md:hidden text-gray-700">
          <Menu />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <nav className="flex flex-col gap-4 mt-8">
          <a href="#" className="text-gray-700 hover:text-primary font-medium py-2 px-4 rounded hover:bg-gray-100">How It Works</a>
          <a href="#" className="text-gray-700 hover:text-primary font-medium py-2 px-4 rounded hover:bg-gray-100">Services</a>
          <a href="#" className="text-gray-700 hover:text-primary font-medium py-2 px-4 rounded hover:bg-gray-100">Reviews</a>
          <a href="#" className="text-gray-700 hover:text-primary font-medium py-2 px-4 rounded hover:bg-gray-100">Contact</a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
