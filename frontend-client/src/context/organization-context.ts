import { createContext, useContext } from "react";
import type { OrganizationSummary } from "@/services/organizations";

export type OrganizationContextValue = {
  organizations: OrganizationSummary[];
  isLoading: boolean;
  currentOrg: OrganizationSummary | null;
  setCurrentOrgId: (id: string) => void;
  refetch: () => void;
};

export const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error("useOrganization must be used within an OrganizationProvider");
  return context;
}
