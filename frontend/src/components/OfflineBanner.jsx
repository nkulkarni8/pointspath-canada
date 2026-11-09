import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";

export default function OfflineBanner() {
  const { t } = useApp();
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div role="status" style={{ background: `${t.warn}22`, borderBottom: `1px solid ${t.warn}44`, color: t.warn, fontSize: 12, fontWeight: 600, padding: "7px 24px", textAlign: "center" }}>
      You're offline — showing the last data PointsPath saved. Calculations still work.
    </div>
  );
}
