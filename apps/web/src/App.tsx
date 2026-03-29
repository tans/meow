import { startTransition, useEffect, useState } from "react";
import { AppShell } from "./components/AppShell.js";
import {
  getSession,
  listCreatorTasks,
  listMerchantTasks,
  login,
  switchRole
} from "./lib/api.js";
import {
  mapCreatorTasks,
  mapMerchantTasks,
  type CreatorTaskCardModel,
  type MerchantTaskCardModel
} from "./lib/models.js";
import {
  normalizeWebSession,
  type WebRole,
  type WebSession
} from "./lib/session.js";
import { LoginPage } from "./routes/LoginPage.js";

interface AppProps {
  session?: WebSession | null;
  initialSession?: WebSession | null;
  initialTasks?: CreatorTaskCardModel[] | MerchantTaskCardModel[];
  bootstrapSession?: boolean;
}

export type { WebSession };

const loadSurfaceTasks = async (session: WebSession): Promise<{
  creatorTasks: CreatorTaskCardModel[];
  merchantTasks: MerchantTaskCardModel[];
}> => {
  if (session.activeRole === "creator") {
    return {
      creatorTasks: mapCreatorTasks(await listCreatorTasks()),
      merchantTasks: []
    };
  }

  return {
    creatorTasks: [],
    merchantTasks: mapMerchantTasks(await listMerchantTasks())
  };
};

const getInitialTaskState = (
  session: WebSession | null,
  initialTasks?: CreatorTaskCardModel[] | MerchantTaskCardModel[]
) => ({
  creatorTasks:
    session?.activeRole === "creator"
      ? ((initialTasks as CreatorTaskCardModel[] | undefined) ?? [])
      : [],
  merchantTasks:
    session?.activeRole === "merchant"
      ? ((initialTasks as MerchantTaskCardModel[] | undefined) ?? [])
      : []
});

export default function App({
  session,
  initialSession,
  initialTasks,
  bootstrapSession = false
}: AppProps) {
  const seedSession = initialSession ?? session ?? null;
  const seedTaskState = getInitialTaskState(seedSession, initialTasks);
  const [currentSession, setCurrentSession] = useState<WebSession | null>(seedSession);
  const [creatorTasks, setCreatorTasks] = useState(seedTaskState.creatorTasks);
  const [merchantTasks, setMerchantTasks] = useState(seedTaskState.merchantTasks);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!bootstrapSession || seedSession) {
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      setLoading(true);

      try {
        const sessionPayload = await getSession();

        if (!sessionPayload || cancelled) {
          return;
        }

        const nextSession = normalizeWebSession(sessionPayload);
        const nextTaskState = await loadSurfaceTasks(nextSession);

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setCurrentSession(nextSession);
          setCreatorTasks(nextTaskState.creatorTasks);
          setMerchantTasks(nextTaskState.merchantTasks);
          setStatusMessage(undefined);
        });
      } catch {
        if (!cancelled) {
          setStatusMessage("会话恢复失败，请重新登录。");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [bootstrapSession, seedSession]);

  const handleLogin = async (input: {
    identifier: string;
    secret: string;
    client: "web";
  }) => {
    setLoading(true);
    setStatusMessage(undefined);

    try {
      const response = await login(input);
      const nextSession = normalizeWebSession(response);
      const nextTaskState = await loadSurfaceTasks(nextSession);

      startTransition(() => {
        setCurrentSession(nextSession);
        setCreatorTasks(nextTaskState.creatorTasks);
        setMerchantTasks(nextTaskState.merchantTasks);
      });
    } catch {
      setStatusMessage("登录失败，请检查演示账号或后端配置。");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchRole = async (role: WebRole) => {
    if (!currentSession || role === currentSession.activeRole) {
      return;
    }

    setLoading(true);
    setStatusMessage(undefined);

    try {
      const response = await switchRole(role);
      const nextSession = normalizeWebSession(response, currentSession.user);
      const nextTaskState = await loadSurfaceTasks(nextSession);

      startTransition(() => {
        setCurrentSession(nextSession);
        setCreatorTasks(nextTaskState.creatorTasks);
        setMerchantTasks(nextTaskState.merchantTasks);
      });
    } catch {
      setStatusMessage("角色切换失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  if (!currentSession) {
    return (
      <LoginPage
        loading={loading}
        errorMessage={statusMessage}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <AppShell
      session={currentSession}
      creatorTasks={creatorTasks}
      merchantTasks={merchantTasks}
      switchingRole={loading}
      statusMessage={statusMessage}
      onSwitchRole={handleSwitchRole}
    />
  );
}
