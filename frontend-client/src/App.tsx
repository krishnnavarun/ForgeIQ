import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Developer } from "@/pages/Developer";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { OAuthCallback } from "@/pages/OAuthCallback";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { Register } from "@/pages/Register";

function App() {
  return (
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
          <Route
            path="recruiter"
            element={
              <PlaceholderPage
                title="Recruiter Workspace"
                description="Authorized candidate discovery will be available here when backend access is implemented."
              />
            }
          />
          <Route
            path="organization"
            element={
              <PlaceholderPage
                title="Organization"
                description="Organization membership, permissions, and settings will be managed here."
              />
            }
          />
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
  );
}

export default App
