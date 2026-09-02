import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

/**
 * Stage 5: the admin panel lives at /admin/* on the same origin so the
 * session cookie travels automatically. We split it into a separate
 * chunk with React.lazy so the admin code never lands in the Mini App
 * bundle — Telegram downloads are size-sensitive and the admin is for
 * the operator's browser, not the customer's.
 */
const AdminApp = lazy(() => import("./admin/AdminApp"));

function Root() {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
    return (
      <Suspense fallback={<div style={{ padding: 40, fontFamily: "system-ui" }}>Loading…</div>}>
        <AdminApp />
      </Suspense>
    );
  }
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
