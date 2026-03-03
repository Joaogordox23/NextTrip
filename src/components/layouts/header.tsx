"use client";

import { useAuthStore } from "@/store/auth.store";
import { LogOut, Map, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Header() {
    const { user, setUser } = useAuthStore();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleLogout = async () => {
        // Basic stateless logout by cleaning cookie (Server clears automatically via redirect unauth or edge)
        setUser(null);
        document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push("/login");
    };

    if (!isMounted || !user) return null;

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Link
                    href={user.role === "ADMIN" ? "/admin/trips" : "/client/my-trips"}
                    className="flex items-center gap-2 font-bold text-xl tracking-tight"
                >
                    <Map className="h-6 w-6 text-primary" />
                    <span>Next<span className="text-primary italic">Trip</span></span>
                </Link>
                <div className="flex items-center gap-4">
                    <nav className="flex items-center gap-4 text-sm font-medium">

                        {user.role === "ADMIN" && (
                            <Link href="/admin/suggestions" className="transition-colors hover:text-foreground/80 text-foreground">
                                Revisar Sugestões
                            </Link>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-2">
                                    <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary transition-all">
                                        <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                                        <AvatarFallback className="bg-primary/10 text-primary">{(user.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.name || "Usuário"}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild className="cursor-pointer">
                                    <Link href={user.role === "ADMIN" ? "/admin/profile" : "/client/profile"} className="flex w-full items-center">
                                        <UserCircle className="mr-2 h-4 w-4" />
                                        <span>Meu Perfil</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sair</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>
                </div>
            </div>
        </header>
    );
}

// Simple internal Badge fallback since Shadcn Badge is not imported directly here
function Badge({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: string }) {
    const base = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
    const variants: Record<string, string> = {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    }
    return <div className={`${base} ${variants[variant] || variants.default} ${className}`}>{children}</div>
}
