import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppSidebar, type RouteKey } from "./components/AppSidebar";
import { ApiStatus } from "./components/ApiStatus";
import { Dashboard } from "./pages/Dashboard";
import { Pessoas } from "./pages/Pessoas";

const queryClient = new QueryClient();

export function App() {
  const [route, setRoute] = useState<RouteKey>("/");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <AppSidebar activePath={route} onNavigate={setRoute} />

        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
            <span className="text-sm font-medium text-slate-500">
              Sistema de Gestão de Farmácia Clínica
            </span>
            <ApiStatus />
          </header>

          <main className="flex-1 p-6">
            {route === "/" && <Dashboard />}
            {route === "/pessoas" && <Pessoas />}
            {route !== "/" && route !== "/pessoas" && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                Página <strong>{route}</strong> será conectada nos próximos passos.
              </div>
            )}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;