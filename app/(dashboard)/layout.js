import Sidebar from "../../components/layout/sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50 max-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}