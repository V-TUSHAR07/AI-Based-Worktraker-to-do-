"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/context", label: "Context" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="w-full flex justify-center sticky top-0 z-30">
      <div className="backdrop-blur-xl bg-purple-100/70 border border-purple-200 shadow-2xl rounded-3xl mt-6 mb-10 px-2 sm:px-8 py-3 sm:py-4 flex flex-wrap gap-3 sm:gap-6 items-center justify-center max-w-full sm:max-w-2xl w-full mx-1 sm:mx-auto transition-all duration-300">
        {navLinks.map(link => (
          <Link key={link.href} href={link.href}>
            <Button
              variant={pathname === link.href ? "default" : "outline"}
              className={
                (pathname === link.href
                  ? "bg-black text-white border-black hover:bg-neutral-800 hover:text-white"
                  : "bg-white text-black border-black hover:bg-neutral-100 hover:text-black") +
                " rounded-full px-6 py-2 text-base font-semibold shadow-md transition-all duration-200 focus:ring-2 focus:ring-purple-300 focus:outline-none hover:scale-105 active:scale-95"
              }
            >
              {link.label}
            </Button>
          </Link>
        ))}
      </div>
    </nav>
  );
} 