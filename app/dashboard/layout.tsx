import AuthGuard from "../components/middleware/AuthGuard";
import TopBar from "../components/ui/dashboard/layout/TopBar";
import SideRail from "../components/ui/dashboard/layout/SideRail";
import BottomNav from "../components/ui/dashboard/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-ghost-white dark:bg-slate-950 flex flex-col overflow-hidden">
      <AuthGuard />
      <TopBar />
      {/* Body: side rail + scrollable content — min-h-0 lets flex children honour h-full */}
      <div className="flex flex-1 min-h-0">
        <SideRail />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
