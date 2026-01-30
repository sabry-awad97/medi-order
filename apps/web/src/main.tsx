import { RouterProvider, createRouter } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { lazy, Suspense } from "react";

import { AppProviders } from "./providers";
import { routeTree } from "./routeTree.gen";
import { Loading } from "./components/ui/loading";
import { SplashScreen } from "./components/splash-screen";

// Lazy load UpdateDialog
const UpdateDialog = lazy(() =>
  import("./components/update-dialog").then((m) => ({
    default: m.UpdateDialog,
  })),
);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: () => <Loading />,
  context: {},
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <AppProviders>
      <SplashScreen />
      <RouterProvider router={router} />
      <Suspense fallback={null}>
        <UpdateDialog />
      </Suspense>
    </AppProviders>,
  );
}
