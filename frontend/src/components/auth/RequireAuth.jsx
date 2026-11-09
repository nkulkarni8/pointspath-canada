import { Outlet } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import ProtectedRoute from "./ProtectedRoute";

/** Route-level gate so each protected page doesn't repeat the wrapper itself. */
export default function RequireAuth() {
  const { country, t } = useApp();
  return (
    <ProtectedRoute country={country} accentColor={t.accent}>
      <Outlet />
    </ProtectedRoute>
  );
}
