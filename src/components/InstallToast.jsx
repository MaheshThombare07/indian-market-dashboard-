export default function InstallToast() {
  return (
    <div className="install-toast" id="installToast">
      <div className="toast-title">Add to Home Screen</div>
      <div className="toast-body">Install India Market Snapshot as an app — quick access, works offline.</div>
      <div className="toast-btns">
        <button className="toast-install" id="toastInstall">Install</button>
        <button className="toast-dismiss" id="toastDismiss">Not now</button>
      </div>
    </div>
  );
}
