import type { EnvMapping } from "@/lib/env-mapping";
import type { AppDefinition } from "./types";

const resendEnvMappings: EnvMapping[] = [
  { envName: "RESEND_API_KEY", placeholder: "humr:sentinel" },
];

export const resend: AppDefinition = {
  id: "resend",
  name: "Resend",
  icon: "/icons/resend.svg",
  darkIcon: "/icons/resend-light.svg",
  description: "Send transactional and marketing emails.",
  connectionMethod: {
    type: "api_key",
    fields: [
      {
        name: "apiKey",
        label: "API Key",
        description: "Your Resend API key. Find it at resend.com/api-keys",
        placeholder: "re_...",
      },
    ],
  },
  available: true,
  envMappings: resendEnvMappings,
};
