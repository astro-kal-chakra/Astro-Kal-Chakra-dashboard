"use client";

import { useState } from "react";
import { AdminProvider } from "@/providers/AdminProvider";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { IdleTimeout } from "./IdleTimeout";

export function AdminShell({ admin, counts, children }) {
  const [menu, setMenu] = useState(false);
  return (
    <AdminProvider admin={admin}>
      <div className="flex min-h-screen">
        <Sidebar counts={counts} open={menu} onClose={() => setMenu(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setMenu(true)} counts={counts} />
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6 sm:py-7">{children}</main>
        </div>
      </div>
      <IdleTimeout />
    </AdminProvider>
  );
}
