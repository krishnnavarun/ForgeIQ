import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link to="/" className="flex items-center justify-center">
          <span className="font-bold text-xl tracking-tight">ForgeIQ</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link to="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link to="/register">
            <Button>Get Started</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex items-center justify-center flex-col gap-6 text-center px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-3xl">
          Developer Intelligence and Candidate Discovery
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
          Transform fragmented development activity into reliable operational information and connect top developers with leading organizations.
        </p>
        <div className="flex gap-4 mt-4">
          <Link to="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
