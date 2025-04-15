import { Menu, LogIn, LogOut, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();

  const handleLogin = () => {
    navigate("/auth");
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center">
              <span className="text-primary text-3xl mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </span>
              <h1 className="text-xl font-semibold text-gray-900">MoveEase</h1>
            </a>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <ul className="flex space-x-8">
            <li><a href="#how-it-works" className="text-gray-700 hover:text-primary font-medium">How It Works</a></li>
            <li><a href="#services" className="text-gray-700 hover:text-primary font-medium">Services</a></li>
            <li><a href="#reviews" className="text-gray-700 hover:text-primary font-medium">Reviews</a></li>
            <li><a href="#faq" className="text-gray-700 hover:text-primary font-medium">FAQ</a></li>
          </ul>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative rounded-full h-8 w-8 p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuLabel className="font-normal text-sm text-muted-foreground">
                  {user.username}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/?tab=profile">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{logoutMutation.isPending ? "Logging out..." : "Log out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleLogin} variant="outline" size="sm" className="ml-4">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
          )}
        </nav>
        
        <MobileMenu user={user} onLogin={handleLogin} onLogout={handleLogout} isLoggingOut={logoutMutation.isPending} />
      </div>
    </header>
  );
}

function MobileMenu({ 
  user, 
  onLogin, 
  onLogout, 
  isLoggingOut 
}: {
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="md:hidden text-gray-700">
          <Menu />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        {user && (
          <div className="flex items-center gap-3 py-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.username}</p>
              <p className="text-sm text-muted-foreground">Logged in</p>
            </div>
          </div>
        )}
        
        <Separator className="my-4" />
        
        <nav className="flex flex-col gap-4">
          <a href="#how-it-works" className="text-gray-700 hover:text-primary font-medium py-2 px-4 rounded hover:bg-gray-100">How It Works</a>
          <a href="#services" className="text-gray-700 hover:text-primary font-medium py-2 px-4 rounded hover:bg-gray-100">Services</a>
          <a href="#reviews" className="text-gray-700 hover:text-primary font-medium py-2 px-4 rounded hover:bg-gray-100">Reviews</a>
          <a href="#faq" className="text-gray-700 hover:text-primary font-medium py-2 px-4 rounded hover:bg-gray-100">FAQ</a>
          
          <Separator className="my-2" />
          
          {user ? (
            <>
              <Link href="/?tab=profile">
                <a className="flex items-center text-gray-700 hover:text-primary font-medium py-2 px-4 rounded hover:bg-gray-100">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </a>
              </Link>
              <button 
                onClick={onLogout}
                disabled={isLoggingOut}
                className="flex items-center text-gray-700 hover:text-primary font-medium py-2 px-4 rounded hover:bg-gray-100 text-left"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? "Logging out..." : "Log out"}
              </button>
            </>
          ) : (
            <button 
              onClick={onLogin}
              className="flex items-center text-gray-700 hover:text-primary font-medium py-2 px-4 rounded hover:bg-gray-100"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
