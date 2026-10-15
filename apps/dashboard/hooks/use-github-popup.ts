"use client";

import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { GITHUB_CONNECTION_CHANNEL, isGitHubConnectionMessage, type GitHubConnectionResult } from "@/lib/github-connection-result";

export function useGitHubPopup(onConnected?: () => void) {
  const { mutate } = useSWRConfig();
  const popup = useRef<Window | null>(null);
  const awaitingResult = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectedCallback = useRef(onConnected);
  useEffect(() => { connectedCallback.current = onConnected; }, [onConnected]);
  const refresh = useCallback(() => {
    void mutate((key) => typeof key === "string" && key.startsWith("github-"), undefined, { revalidate: true, populateCache: false });
  }, [mutate]);

  useEffect(() => {
    function finish(result: GitHubConnectionResult) {
      if (!awaitingResult.current) return;
      awaitingResult.current = false;
      if (closeTimer.current) clearInterval(closeTimer.current);
      popup.current?.close();
      popup.current = null;
      if (result === "connected") connectedCallback.current?.();
      refresh();
      if (result === "connected") toast.success("GitHub connected successfully.");
      else if (result === "approval_required") toast.info("Your organization owner needs to approve the GitHub App installation.");
      else if (result === "installation_required") toast.error("Install Fleet with read access to repository contents.");
      else toast.error("GitHub connection failed. Please try again.");
    }
    function receiveMessage(event: MessageEvent) {
      if (event.origin === window.location.origin && event.source === popup.current && isGitHubConnectionMessage(event.data)) {
        finish(event.data.result);
      }
    }
    window.addEventListener("message", receiveMessage);
    let channel: BroadcastChannel | undefined;
    try {
      channel = new BroadcastChannel(GITHUB_CONNECTION_CHANNEL);
      channel.onmessage = (event) => { if (isGitHubConnectionMessage(event.data)) finish(event.data.result); };
    } catch { /* Same-origin postMessage handles browsers without BroadcastChannel. */ }
    return () => {
      window.removeEventListener("message", receiveMessage);
      channel?.close();
      if (closeTimer.current) clearInterval(closeTimer.current);
    };
  }, [refresh]);

  return useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(event.currentTarget.href);
    url.searchParams.set("popup", "1");
    const width = Math.min(780, window.screen.availWidth);
    const height = Math.min(800, window.screen.availHeight);
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
    const opened = window.open(url.toString(), "fleet-github", `popup=yes,width=${width},height=${height},left=${left},top=${top}`);
    if (!opened) return; // Let the anchor navigate normally when popups are blocked.
    event.preventDefault();
    popup.current = opened;
    awaitingResult.current = true;
    opened.focus();
    if (closeTimer.current) clearInterval(closeTimer.current);
    closeTimer.current = setInterval(() => {
      if (opened.closed) {
        if (closeTimer.current) clearInterval(closeTimer.current);
        // Keep listening: an isolated popup may still deliver its result later.
        refresh();
      }
    }, 500);
  }, [refresh]);
}
