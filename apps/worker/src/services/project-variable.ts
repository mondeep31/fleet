import { ProjectVariable } from "@fleet/db";
import { decryptSecret } from "@fleet/secrets";
import { getSharedEnv } from "@fleet/config";

export async function getDecryptedProjectVariables(
  projectId: string,
): Promise<Record<string, string>> {
  const key = getSharedEnv().FLEET_SECRETS_ENCRYPTION_KEY;
  const vars = await ProjectVariable.find({ projectId });
  const result: Record<string, string> = {};
  for (const v of vars) {
    result[v.key] = decryptSecret(
      { ciphertext: v.ciphertext, iv: v.iv, authTag: v.authTag },
      key,
    );
  }
  return result;
}
