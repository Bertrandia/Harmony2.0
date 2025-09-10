// "use client";

// import React, { useState } from "react";
// import { usePathname } from "next/navigation";
// import { useAuth } from "../app/context/AuthContext";
// import Link from "next/link";

// import {
//   Home,
//   LogIn,
//   LayoutDashboard,
//   Menu,
//   X,
//   Sun,
//   FileText,
//   MessageSquare,
//   Users,
//   CreditCard,
//   CalendarDays
// } from "lucide-react";
// import { useTheme } from "next-themes";

// const navigationItems = [
//   { name: "Dashboard", href: "/dashboard", icon: Home },
//   { name: "PatronOS Chat", href: "/chat", icon: MessageSquare },
//   { name: "My-Tasks", href: "/mytasks", icon: LayoutDashboard },
//   // {
//   //   name: "All-LM-Invoices",
//   //   href: "/allLMInvoicesList",
//   //   icon: FileText
//   // },
//   {
//     name: "My-Patrons",
//     href: "/mypatrons",
//     icon: Users,
//   },
//   {
//     name: "LM-Expenses",
//     href: "/lmexpenses",
//     icon: CreditCard,
//   },
//   {
//     name: "Tasks-Due-Today",
//     href: "/mytasks?filtername=taskduedateistoday",
//     icon: CalendarDays,
//   },
// ];

// export function Sidebar({ children }) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const pathname = usePathname();
//   const { theme, setTheme } = useTheme();
//   const { logout } = useAuth();

//   const toggleTheme = () => {
//     setTheme(theme === "dark" ? "light" : "dark");
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Mobile top bar */}
//       <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
//         <button
//           type="button"
//           className="-m-2.5 p-2.5 text-foreground lg:hidden"
//           onClick={() => setSidebarOpen(true)}
//         >
//           <span className="sr-only">Open sidebar</span>
//           <Menu className="h-6 w-6" aria-hidden="true" />
//         </button>

//         <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
//           <div className="flex items-center gap-x-4">
//             <h1 className="text-xl font-semibold text-foreground">Harmony</h1>
//           </div>
//         </div>
//       </div>

//       {/* Desktop sidebar */}
//       <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
//         <div className="flex grow flex-col overflow-y-auto border-r border-border bg-background px-6 pb-4">
//           {/* Top section */}
//           <div className="flex h-16 shrink-0 items-center justify-between">
//             <h1 className="text-xl font-semibold text-foreground">HARMONY</h1>
//           </div>

//           {/* Navigation links */}
//           <nav className="flex flex-1 flex-col">
//             <ul role="list" className="flex flex-1 flex-col gap-y-7">
//               <li>
//                 <ul role="list" className="-mx-2 space-y-1">
//                   {navigationItems.map((item) => {
//                     const isActive = pathname === item.href;
//                     return (
//                       <li key={item.name}>
//                         <Link
//                           href={item.href}
//                           className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-all duration-200 ${
//                             isActive
//                               ? "bg-accent text-accent-foreground shadow-sm"
//                               : "text-muted-foreground hover:text-foreground hover:bg-accent"
//                           }`}
//                         >
//                           <item.icon
//                             className={`h-5 w-5 shrink-0 transition-colors ${
//                               isActive
//                                 ? "text-accent-foreground"
//                                 : "text-muted-foreground group-hover:text-foreground"
//                             }`}
//                             aria-hidden="true"
//                           />
//                           {item.name}
//                         </Link>
//                       </li>
//                     );
//                   })}
//                 </ul>
//               </li>
//             </ul>
//           </nav>

//           {/* Logout button fixed at bottom */}
//           <div className="mt-auto pt-4 border-t border-border">
//             <button
//               onClick={logout}
//               className="w-full text-left group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
//             >
//               <LogIn className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
//               Logout
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Mobile sidebar */}
//       <div className={`relative z-50 lg:hidden ${sidebarOpen ? "" : "hidden"}`}>
//         <div
//           className="fixed inset-0 bg-background/80 backdrop-blur-sm"
//           onClick={() => setSidebarOpen(false)}
//         />
//         <div className="fixed inset-0 flex">
//           <div className="relative mr-16 flex w-full max-w-xs flex-1">
//             <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
//               <button
//                 type="button"
//                 className="-m-2.5 p-2.5"
//                 onClick={() => setSidebarOpen(false)}
//               >
//                 <span className="sr-only">Close sidebar</span>
//                 <X className="h-6 w-6 text-foreground" aria-hidden="true" />
//               </button>
//             </div>
//             <div className="flex grow flex-col bg-background px-6 pb-4 ring-1 ring-border">
//               <div className="flex h-16 shrink-0 items-center">
//                 <h1 className="text-xl font-semibold text-foreground">NOC</h1>
//               </div>
//               <nav className="flex flex-1 flex-col overflow-y-auto">
//                 <ul role="list" className="flex flex-1 flex-col gap-y-7">
//                   <li>
//                     <ul role="list" className="-mx-2 space-y-1">
//                       {navigationItems.map((item) => {
//                         const isActive = pathname === item.href;
//                         return (
//                           <li key={item.name}>
//                             <Link
//                               href={item.href}
//                               className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-all duration-200 ${
//                                 isActive
//                                   ? "bg-accent text-accent-foreground shadow-sm"
//                                   : "text-muted-foreground hover:text-foreground hover:bg-accent"
//                               }`}
//                             >
//                               <item.icon
//                                 className={`h-5 w-5 shrink-0 transition-colors ${
//                                   isActive
//                                     ? "text-accent-foreground"
//                                     : "text-muted-foreground group-hover:text-foreground"
//                                 }`}
//                                 aria-hidden="true"
//                               />
//                               {item.name}
//                             </Link>
//                           </li>
//                         );
//                       })}
//                     </ul>
//                   </li>
//                 </ul>
//               </nav>

//               {/* Logout at bottom for mobile */}
//               <div className="mt-auto pt-4 border-t border-border">
//                 <button
//                   onClick={() => {
//                     logout();
//                     setSidebarOpen(false);
//                   }}
//                   className="w-full text-left group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
//                 >
//                   <LogIn className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
//                   Logout
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main content */}
//       <div className="lg:pl-72">
//         <main className="min-h-screen">{children}</main>
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "../app/context/AuthContext";
import Link from "next/link";

import {
  Home,
  LogIn,
  LayoutDashboard,
  Menu,
  X,
  FileText,
  MessageSquare,
  Users,
  CreditCard,
  CalendarDays,
} from "lucide-react";
import { useTheme } from "next-themes";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "PatronOS Chat", href: "/chat", icon: MessageSquare },
  { name: "My-Tasks", href: "/mytasks", icon: LayoutDashboard },
  {
    name: "My-Patrons",
    href: "/mypatrons",
    icon: Users,
  },
  {
    name: "LM-Expenses",
    href: "/lmexpenses",
    icon: CreditCard,
  },
  {
    name: "Tasks-Due-Today",
    href: "/mytasks?filtername=taskduedateistoday",
    icon: CalendarDays,
  },
];

export function Sidebar({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // check if nav item is active
  const checkIsActive = (item) => {
    const url = new URL(item.href, "http://dummy-base"); // to parse href safely
    const itemPath = url.pathname;
    const itemFilter = url.searchParams.get("filtername");

    // Case 1: Item has NO query param → active only if pathname matches
    // and no filter param is in the actual URL
    if (!itemFilter) {
      return pathname === itemPath && searchParams.get("filtername") === null;
    }

    // Case 2: Item has a query param → active if both path + query match
    return (
      pathname === itemPath && searchParams.get("filtername") === itemFilter
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-foreground lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex items-center gap-x-4">
            <h1 className="text-xl font-semibold text-foreground">Harmony</h1>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto border-r border-border bg-background px-6 pb-4">
          {/* Top section */}
          <div className="flex h-16 shrink-0 items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">HARMONY</h1>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigationItems.map((item) => {
                    const isActive = checkIsActive(item);
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-all duration-200 ${
                            isActive
                              ? "bg-accent text-accent-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          }`}
                        >
                          <item.icon
                            className={`h-5 w-5 shrink-0 transition-colors ${
                              isActive
                                ? "text-accent-foreground"
                                : "text-muted-foreground group-hover:text-foreground"
                            }`}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>

          {/* Logout button fixed at bottom */}
          <div className="mt-auto pt-4 border-t border-border">
            <button
              onClick={logout}
              className="w-full text-left group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <LogIn className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`relative z-50 lg:hidden ${sidebarOpen ? "" : "hidden"}`}>
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                className="-m-2.5 p-2.5"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-foreground" aria-hidden="true" />
              </button>
            </div>
            <div className="flex grow flex-col bg-background px-6 pb-4 ring-1 ring-border">
              <div className="flex h-16 shrink-0 items-center">
                <h1 className="text-xl font-semibold text-foreground">NOC</h1>
              </div>
              <nav className="flex flex-1 flex-col overflow-y-auto">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigationItems.map((item) => {
                        const isActive = checkIsActive(item);
                        return (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-all duration-200 ${
                                isActive
                                  ? "bg-accent text-accent-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                              }`}
                            >
                              <item.icon
                                className={`h-5 w-5 shrink-0 transition-colors ${
                                  isActive
                                    ? "text-accent-foreground"
                                    : "text-muted-foreground group-hover:text-foreground"
                                }`}
                                aria-hidden="true"
                              />
                              {item.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                </ul>
              </nav>

              {/* Logout at bottom for mobile */}
              <div className="mt-auto pt-4 border-t border-border">
                <button
                  onClick={() => {
                    logout();
                    setSidebarOpen(false);
                  }}
                  className="w-full text-left group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                >
                  <LogIn className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
