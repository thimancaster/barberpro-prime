import { SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <SidebarInset className="flex-1">
        <AppHeader />
        <main className="flex-1 p-6 animate-fade-in ambient-bg">
          <div>
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}
