import { useEffect, useCallback } from "react";
import { getVsCodeApi } from "../vscode";
import type { HostToWebviewMessage, WebviewToHostMessage } from "../../../src/types";

export function useVsCodeMessages(
  onMessage: (message: HostToWebviewMessage) => void
) {
  useEffect(() => {
    const handler = (event: MessageEvent<HostToWebviewMessage>) => {
      onMessage(event.data);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onMessage]);

  const postMessage = useCallback((message: WebviewToHostMessage) => {
    getVsCodeApi().postMessage(message);
  }, []);

  return { postMessage };
}
