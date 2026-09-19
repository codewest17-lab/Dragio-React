import { useEffect, useRef, useState } from "react";

export default function PWAInstallBanner() {
  const [visible, setVisible] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    function onBeforeInstall(event) {
      event.preventDefault();
      deferredPrompt.current = event;
      if (localStorage.getItem("dragio_install_dismissed") === "true") return;
      setVisible(true);
    }

    function onInstalled() {
      setVisible(false);
      localStorage.setItem("dragio_install_dismissed", "true");
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    await deferredPrompt.current.userChoice;
    setVisible(false);
    localStorage.setItem("dragio_install_dismissed", "true");
    deferredPrompt.current = null;
  }

  if (!visible) return null;

  return (
    <div className="install-banner glass visible">
      <div>
        <strong style={{ fontSize: 14 }}>Install Dragio</strong>
        <p style={{ fontSize: 13 }}>Add to your home screen for the full app experience.</p>
      </div>
      <button className="btn btn-primary" style={{ width: "auto", padding: "10px 18px" }} onClick={handleInstall}>
        Install
      </button>
    </div>
  );
}
