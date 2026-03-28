import { routeContracts } from "@meow/contracts";
import { workspaceManifest } from "@meow/domain-core";
import { taskLifecycle } from "@meow/domain-task";
import { appUserModules } from "@meow/domain-user";

export const appShellBlueprint = {
  shell: "user-app",
  targetSurfaces: ["native-app", "mini-program"],
  navigationGroups: [
    {
      id: "merchant",
      title: "商家工作台",
      modules: appUserModules.filter((module) => module.personas.includes("merchant"))
    },
    {
      id: "creator",
      title: "创作者工作台",
      modules: appUserModules.filter((module) => module.personas.includes("creator"))
    }
  ],
  routeContracts: routeContracts.filter((route) => route.surface === "app"),
  taskLifecycle
};

if (process.env.MEOW_PRINT_BLUEPRINT === "1") {
  console.log(
    JSON.stringify(
      {
        appShellBlueprint,
        workspaceApps: workspaceManifest.apps.filter((app) => app.surface === "app")
      },
      null,
      2
    )
  );
}

