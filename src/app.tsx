import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import { MetaProvider } from "@solidjs/meta";
import { getRequestEvent, isServer } from "solid-js/web";

export default function App() {
  return (
    <MetaProvider>
      <Router
        url={isServer ? getRequestEvent()?.request.url : ""}
        root={(props) => (
          <Suspense fallback={<div class="bg-background size-full" />}>
            <div class="flex flex-col items-center w-full min-h-full flex-1">
              {props.children}
            </div>
          </Suspense>
        )}
      >
        <FileRoutes />
      </Router>
    </MetaProvider>
  );
}
