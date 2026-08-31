import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMyOrganizations } from "@/services/organizations";
import { OrganizationContext } from "./organization-context";

const STORAGE_KEY = "forgeiq.currentOrganizationId";

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { data: organizations = [], isLoading, refetch } = useQuery({
    queryKey: ["organizations"],
    queryFn: listMyOrganizations,
  });
  const [preferredOrgId, setPreferredOrgId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  function setCurrentOrgId(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setPreferredOrgId(id);
  }

  const currentOrg = organizations.find((org) => org.id === preferredOrgId) ?? organizations[0] ?? null;

  return (
    <OrganizationContext.Provider value={{ organizations, isLoading, currentOrg, setCurrentOrgId, refetch }}>
      {children}
    </OrganizationContext.Provider>
  );
}
