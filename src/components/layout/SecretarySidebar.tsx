
import Logo from "@/components/shared/Logo";
import SecretarySidebarNav from "./SecretarySidebarNav";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SecretarySidebar() {
  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:bottom-0 md:z-40 md:w-64 md:border-r md:bg-sidebar md:text-sidebar-foreground shadow-lg">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Logo className="text-sidebar-foreground" />
      </div>
      <ScrollArea className="flex-1">
        <SecretarySidebarNav />
      </ScrollArea>
    </aside>
  );
}
