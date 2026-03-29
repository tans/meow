import { AppShell } from "./components/AppShell.js";
import type { WebSession } from "./lib/session.js";
import { LoginPage } from "./routes/LoginPage.js";

interface AppProps {
  session?: WebSession | null;
}

export type { WebSession };

export default function App({ session = null }: AppProps) {
  if (!session) {
    return <LoginPage />;
  }

  return <AppShell session={session} />;
}
