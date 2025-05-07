import Logo from "@/components/shared/Logo";
import AdminSidebarNav from "./AdminSidebarNav";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminSidebar() {
  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:bottom-0 md:z-40 md:w-64 md:border-r md:bg-sidebar md:text-sidebar-foreground shadow-lg">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Logo className="text-sidebar-foreground" />
      </div>
      <ScrollArea className="flex-1">
        <AdminSidebarNav />
      </ScrollArea>
      {/* Optional: Footer content for sidebar */}
      {/* <div className="mt-auto p-4">
        <p className="text-xs text-sidebar-foreground/70">&copy; 2024 Report-Manager Lite</p>
      </div> */}
    </aside>
  );
}
