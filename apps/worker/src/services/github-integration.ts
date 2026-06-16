import { Integration } from "@fleet/db";
import { decryptSecret } from "@fleet/secrets";
import { getSharedEnv } from "@fleet/config";

export async function getDecryptedGitHubToken(userId: string): Promise<string> {
  const { FLEET_SECRETS_ENCRYPTION_KEY } = getSharedEnv();
  const integration = await Integration.findOne({ userId, provider: "github" });
  if (!integration) {
    throw new Error(
      "GitHub is not connected. Connect GitHub on the Connections page to deploy private repositories.",
    );
  }
  return decryptSecret(
    { ciphertext: integration.ciphertext, iv: integration.iv, authTag: integration.authTag },
    FLEET_SECRETS_ENCRYPTION_KEY,
  );
}
