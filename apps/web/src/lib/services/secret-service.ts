import { db, Prisma } from "@onecli/db";
import { cryptoService } from "@/lib/crypto";
import { ServiceError } from "@/lib/services/errors";
import { DEMO_SECRET_NAME, DEMO_SECRET_VALUE } from "@/lib/constants";
import {
  detectAnthropicAuthMode,
  type CreateSecretInput,
  type UpdateSecretInput,
} from "@/lib/validations/secret";

const SECRET_TYPE_LABELS: Record<string, string> = {
  anthropic: "Anthropic API Key",
  generic: "Generic Secret",
};

/**
 * Prisma stores `null` as `Prisma.JsonNull`. Wraps a plain object in the
 * appropriate shape, or returns `JsonNull` for an empty object so the column
 * is cleared rather than set to `{}`.
 */
const toMetadataColumn = (
  obj: Record<string, unknown>,
): Prisma.InputJsonValue | typeof Prisma.JsonNull =>
  Object.keys(obj).length > 0
    ? (obj as Prisma.InputJsonValue)
    : Prisma.JsonNull;

/** Canonical shape for the injectionConfig JSON column. `null` clears it. */
type InjectionConfigInput = {
  headerName: string;
  valueFormat?: string;
} | null | undefined;

const toInjectionConfigColumn = (
  type: string,
  cfg: InjectionConfigInput,
): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
  if (type !== "generic" || !cfg) return Prisma.JsonNull;
  return {
    headerName: cfg.headerName.trim(),
    valueFormat: cfg.valueFormat?.trim() || "{value}",
  } as Prisma.InputJsonValue;
};

/**
 * Build a masked preview of a plaintext value.
 * Shows first 4 and last 4 characters: "sk-ant-a--------xxxx"
 */
const buildPreview = (plaintext: string): string => {
  if (plaintext.length <= 8) return "\u2022".repeat(plaintext.length);
  return `${plaintext.slice(0, 4)}${"\u2022".repeat(8)}${plaintext.slice(-4)}`;
};

export const listSecrets = async (accountId: string) => {
  const secrets = await db.secret.findMany({
    where: { accountId },
    select: {
      id: true,
      name: true,
      type: true,
      hostPattern: true,
      pathPattern: true,
      injectionConfig: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return secrets.map((s) => ({
    ...s,
    typeLabel: SECRET_TYPE_LABELS[s.type] ?? s.type,
  }));
};

export type { CreateSecretInput, UpdateSecretInput };

export const createSecret = async (
  accountId: string,
  input: CreateSecretInput,
) => {
  const name = input.name.trim();
  if (!name || name.length > 255) {
    throw new ServiceError(
      "BAD_REQUEST",
      "Name must be between 1 and 255 characters",
    );
  }

  const value = input.value.trim();
  if (!value) throw new ServiceError("BAD_REQUEST", "Secret value is required");

  const hostPattern = input.hostPattern.trim();
  if (!hostPattern)
    throw new ServiceError("BAD_REQUEST", "Host pattern is required");

  if (input.type === "generic") {
    if (!input.injectionConfig?.headerName?.trim()) {
      throw new ServiceError(
        "BAD_REQUEST",
        "Header name is required for generic secrets",
      );
    }
  }

  const encryptedValue = await cryptoService.encrypt(value);
  const preview = buildPreview(value);
  const pathPattern = input.pathPattern?.trim() || null;
  const injectionConfig = toInjectionConfigColumn(input.type, input.injectionConfig);

  const metadataObj: Record<string, unknown> = {};
  if (input.type === "anthropic") {
    metadataObj.authMode = detectAnthropicAuthMode(value) ?? "api-key";
  }
  if (input.metadata?.envMappings) {
    metadataObj.envMappings = input.metadata.envMappings;
  }
  const metadata = toMetadataColumn(metadataObj);

  const secret = await db.secret.create({
    data: {
      name,
      type: input.type,
      encryptedValue,
      hostPattern,
      pathPattern,
      injectionConfig,
      metadata,
      accountId,
    },
    select: {
      id: true,
      name: true,
      type: true,
      hostPattern: true,
      pathPattern: true,
      metadata: true,
      createdAt: true,
    },
  });

  return { ...secret, preview };
};

export const deleteSecret = async (accountId: string, secretId: string) => {
  const secret = await db.secret.findFirst({
    where: { id: secretId, accountId },
    select: { id: true },
  });

  if (!secret) throw new ServiceError("NOT_FOUND", "Secret not found");

  await db.secret.delete({ where: { id: secretId } });
};

export const updateSecret = async (
  accountId: string,
  secretId: string,
  input: UpdateSecretInput,
) => {
  const secret = await db.secret.findFirst({
    where: { id: secretId, accountId },
    select: { id: true, type: true, metadata: true },
  });

  if (!secret) throw new ServiceError("NOT_FOUND", "Secret not found");

  const data: Record<string, unknown> = {};
  const mergedMetadata: Record<string, unknown> = {
    ...((secret.metadata as Record<string, unknown> | null) ?? {}),
  };
  let metadataDirty = false;

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new ServiceError("BAD_REQUEST", "Name is required");
    data.name = name;
  }

  if (input.value !== undefined) {
    const value = input.value.trim();
    if (!value)
      throw new ServiceError("BAD_REQUEST", "Secret value is required");
    data.encryptedValue = await cryptoService.encrypt(value);

    // Re-detect auth mode when value changes for Anthropic secrets
    if (secret.type === "anthropic") {
      mergedMetadata.authMode = detectAnthropicAuthMode(value) ?? "api-key";
      metadataDirty = true;
    }
  }

  if (input.hostPattern !== undefined) {
    const hostPattern = input.hostPattern.trim();
    if (!hostPattern)
      throw new ServiceError("BAD_REQUEST", "Host pattern is required");
    data.hostPattern = hostPattern;
  }

  if (input.pathPattern !== undefined) {
    data.pathPattern = input.pathPattern?.trim() || null;
  }

  if (input.injectionConfig !== undefined && secret.type === "generic") {
    data.injectionConfig = toInjectionConfigColumn(secret.type, input.injectionConfig);
  }

  if (input.metadata !== undefined) {
    if (input.metadata === null) {
      delete mergedMetadata.envMappings;
    } else if (input.metadata.envMappings !== undefined) {
      mergedMetadata.envMappings = input.metadata.envMappings;
    }
    metadataDirty = true;
  }

  if (metadataDirty) {
    data.metadata = toMetadataColumn(mergedMetadata);
  }

  if (Object.keys(data).length === 0) {
    throw new ServiceError("BAD_REQUEST", "No fields to update");
  }

  await db.secret.update({
    where: { id: secretId },
    data,
  });
};

/**
 * Create the demo secret for an account if it doesn't already exist.
 */
export const seedDemoSecret = async (accountId: string) => {
  const existing = await db.secret.findFirst({
    where: { accountId, name: DEMO_SECRET_NAME },
    select: { id: true },
  });

  if (existing) return;

  await db.secret.create({
    data: {
      name: DEMO_SECRET_NAME,
      type: "generic",
      encryptedValue: await cryptoService.encrypt(DEMO_SECRET_VALUE),
      hostPattern: "httpbin.org",
      pathPattern: "/anything/*",
      injectionConfig: {
        headerName: "Authorization",
        valueFormat: "Bearer {value}",
      },
      accountId,
    },
  });
};
