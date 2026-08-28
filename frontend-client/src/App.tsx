import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Home } from "@/pages/Home";
import { PlaceholderPage } from "@/pages/PlaceholderPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<AppLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route
            path="developer"
            element={
              <PlaceholderPage
                title="Developer Profile"
                description="Your profile, skills, projects, and connected activity will appear here."
              />
            }
          />
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
