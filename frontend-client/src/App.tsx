import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Developer } from "@/pages/Developer";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { OAuthCallback } from "@/pages/OAuthCallback";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { Register } from "@/pages/Register";
import { Organization } from "@/pages/Organization";
import { Projects } from "@/pages/Projects";
import { ProjectDetail } from "@/pages/ProjectDetail";
import { Repositories } from "@/pages/Repositories";
import { RepositoryDetail } from "@/pages/RepositoryDetail";
import { Recruiter } from "@/pages/Recruiter";

// Recharts pulls in a large chunk — only load it once someone visits Analytics.
const Analytics = lazy(() => import("@/pages/Analytics").then((m) => ({ default: m.Analytics })));

function PageFallback() {
  return <div className="panel"><div className="empty-state"><Loader2 className="animate-spin" size={22} /></div></div>;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="oauth/callback" element={<OAuthCallback />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="developer" element={<Developer />} />
              <Route path="organization" element={<Organization />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:projectId" element={<ProjectDetail />} />
              <Route path="repositories" element={<Repositories />} />
              <Route path="repositories/:repositoryId" element={<RepositoryDetail />} />
              <Route
                path="analytics"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <Analytics />
                  </Suspense>
                }
              />
              <Route path="recruiter" element={<Recruiter />} />
              <Route
                path="settings"
                element={
                  <PlaceholderPage
                    title="Settings"
                    description="Account, privacy, and integration settings will be available here."
                  />
                }
              />
            </Route>
          </Route>
          <Route
            path="*"
            element={
              <PlaceholderPage
                title="Page not found"
                description="The requested ForgeIQ page does not exist."
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App
