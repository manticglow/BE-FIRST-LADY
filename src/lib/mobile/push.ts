// Push notifications — no-op on web (used only in native app)
export async function initPush(userId: string | null): Promise<{ granted: boolean }> {
  return { granted: false };
}
export async function removePushListeners() {}
