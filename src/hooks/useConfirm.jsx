import { useState, useCallback, useRef } from "react";

/**
 * Usage:
 *   const { confirm, ConfirmModal } = useConfirm();
 *   const ok = await confirm("Delete this message?");
 *   if (ok) { ...delete... }
 *   return <>{ConfirmModal}...</>
 */
export function useConfirm() {
  const [state, setState] = useState(null); // { message, resolve } | null
  const resolveRef = useRef(null);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ message });
    });
  }, []);

  function respond(result) {
    resolveRef.current?.(result);
    setState(null);
  }

  const ConfirmModal = state ? (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}
      onClick={() => respond(false)}
    >
      <div className="card" style={{ maxWidth: 320, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <p style={{ color: "var(--text)", marginBottom: 16 }}>{state.message}</p>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => respond(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => respond(true)}>Confirm</button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, ConfirmModal };
}
