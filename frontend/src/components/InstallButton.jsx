import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { track } from "../lib/api";

/**
 * Only renders once the browser signals the app is installable, so it stays
 * hidden on iOS and inside an already-installed window.
 */
export default function InstallButton() {
  const { t } = useApp();
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred) return null;

  const install = async () => {
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    track("pwa_install_prompt", { outcome });
    setDeferred(null);
  };

  return (
    <button onClick={install} title="Install PointsPath"
      style={{ background: t.accentBg, border: `1px solid ${t.accent}44`, borderRadius: 9, padding: "8px 12px", color: t.accent, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
      ⤓ Install
    </button>
  );
}
