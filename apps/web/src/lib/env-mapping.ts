import { z } from "zod";

/**
 * Shared shape for "inject this env var into the consumer with this
 * placeholder value" — used on both secret metadata and app registry
 * definitions. The gateway recognizes the placeholder value on outbound
 * requests and swaps it for the real credential.
 */
export const envMappingSchema = z.object({
  envName: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[A-Z_][A-Z0-9_]*$/, "envName must match [A-Z_][A-Z0-9_]*"),
  placeholder: z.string().min(1).max(1000),
});

export type EnvMapping = z.infer<typeof envMappingSchema>;
