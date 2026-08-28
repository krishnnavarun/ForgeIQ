import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch } from "lucide-react";

export function Dashboard() {
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your ForgeIQ workspace.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Connect Integration</CardTitle>
            <CardDescription>Link your accounts to start analyzing data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full gap-2">
              <GitBranch className="h-4 w-4" />
              Connect GitHub
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No data available</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Connect GitHub to start building your developer intelligence profile.
          </p>
        </div>
      </div>
    </div>
  );
}
