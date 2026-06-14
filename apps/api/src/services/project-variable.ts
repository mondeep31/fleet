import { ProjectVariable } from "@fleet/db";
import { encryptSecret, decryptSecret } from "@fleet/secrets";
import { getSharedEnv } from "@fleet/config";

function getEncryptionKey(): string {
  return getSharedEnv().FLEET_SECRETS_ENCRYPTION_KEY;
}

export interface VariableInput {
  key: string;
  value: string;
}

export interface MaskedVariable {
  key: string;
  hasValue: boolean;
}

/**
 * Replace the full set of env vars for a project.
 *
 * Merge semantics for the value field:
 *   - Non-empty value   → encrypt and overwrite (or create).
 *   - Empty value + key already exists → preserve existing ciphertext (secret unchanged).
 *   - Empty value + key is new         → store empty string (allowed).
 *   - Key absent from the list         → deleted.
 */
export async function saveProjectVariables(
  projectId: string,
  variables: VariableInput[],
): Promise<void> {
  const encKey = getEncryptionKey();
  const newKeys = variables.map((v) => v.key);

  // Delete keys removed from the list.
  await ProjectVariable.deleteMany({
    projectId,
    key: { $nin: newKeys },
  });

  // Load existing keys so we can skip re-encryption for preserved secrets.
  const existingKeys = new Set(
    (await ProjectVariable.find({ projectId }).select("key").lean()).map(
      (v) => v.key,
    ),
  );

  for (const { key: varKey, value } of variables) {
    if (value === "" && existingKeys.has(varKey)) {
      // Empty value submitted for an existing key — preserve current ciphertext.
      continue;
    }

    const encrypted = encryptSecret(value, encKey);
    await ProjectVariable.findOneAndUpdate(
      { projectId, key: varKey },
      {
        projectId,
        key: varKey,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      },
      { upsert: true, new: true },
    );
  }
}

/**
 * Returns variable keys with a flag indicating whether a value is set.
 * Never returns plaintext values.
 */
export async function listProjectVariables(
  projectId: string,
): Promise<MaskedVariable[]> {
  const vars = await ProjectVariable.find({ projectId }).sort({ key: 1 });
  return vars.map((v) => ({ key: v.key, hasValue: v.ciphertext.length > 0 }));
}

/**
 * Decrypts and returns all env vars for a project as a plain object.
 * For internal use by the worker only — never expose via HTTP API.
 */
export async function getDecryptedProjectVariables(
  projectId: string,
): Promise<Record<string, string>> {
  const encKey = getEncryptionKey();
  const vars = await ProjectVariable.find({ projectId });
  const result: Record<string, string> = {};
  for (const v of vars) {
    result[v.key] = decryptSecret(
      { ciphertext: v.ciphertext, iv: v.iv, authTag: v.authTag },
      encKey,
    );
  }
  return result;
}
