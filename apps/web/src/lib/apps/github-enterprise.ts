import type { AppDefinition } from "./types";
import { buildGithubAuthUrl, exchangeGithubCode } from "./github-oauth";

const cfgFromConfig = (config: Record<string, string>) => {
  const baseUrl = config.baseUrl;
  if (!baseUrl) {
    throw new Error(
      "GitHub Enterprise connection is missing baseUrl in config",
    );
  }
  return { baseUrl, apiBase: `${baseUrl}/api/v3` };
};

export const githubEnterprise: AppDefinition = {
  id: "github-enterprise",
  name: "GitHub Enterprise",
  icon: "/icons/github-enterprise.svg",
  darkIcon: "/icons/github-enterprise.svg",
  description:
    "Self-hosted GitHub Enterprise Server (GHES). Connect to your organization's own instance.",
  connectionMethod: {
    type: "oauth",
    defaultScopes: [
      "repo",
      "user",
      "gist",
      "notifications",
      "project",
      "codespace",
      "workflow",
    ],
    permissions: [
      {
        scope: "repo",
        name: "Repositories",
        description: "Code, issues, and pull requests",
        access: "write",
      },
      {
        scope: "user",
        name: "Profile",
        description: "Email, name, and avatar",
        access: "read",
      },
      {
        scope: "gist",
        name: "Gists",
        description: "Create and manage gists",
        access: "write",
      },
      {
        scope: "notifications",
        name: "Notifications",
        description: "View notifications",
        access: "read",
      },
      {
        scope: "project",
        name: "Projects",
        description: "Manage project boards",
        access: "write",
      },
      {
        scope: "codespace",
        name: "Codespaces",
        description: "Create and manage",
        access: "write",
      },
      {
        scope: "workflow",
        name: "Actions",
        description: "Update workflow files",
        access: "write",
      },
    ],
    buildAuthUrl: (params) =>
      buildGithubAuthUrl(cfgFromConfig(params.config), params),
    exchangeCode: async (params) => {
      const cfg = cfgFromConfig(params.config);
      const result = await exchangeGithubCode(cfg, params);
      return {
        ...result,
        metadata: { ...(result.metadata ?? {}), baseUrl: cfg.baseUrl },
      };
    },
  },
  available: true,
  configurable: {
    fields: [
      {
        name: "baseUrl",
        label: "Enterprise URL",
        description:
          "The root URL of your GitHub Enterprise Server (e.g. https://github.example.com).",
        placeholder: "https://github.example.com",
        required: true,
      },
      {
        name: "clientId",
        label: "Client ID",
        placeholder: "Iv1.abc123...",
        required: true,
      },
      {
        name: "clientSecret",
        label: "Client Secret",
        placeholder: "secret_...",
        secret: true,
        required: true,
      },
    ],
    envDefaults: {
      baseUrl: "GITHUB_ENTERPRISE_BASE_URL",
      clientId: "GITHUB_ENTERPRISE_CLIENT_ID",
      clientSecret: "GITHUB_ENTERPRISE_CLIENT_SECRET",
    },
  },
  // Enterprise auth flows via ~/.config/gh/hosts.yml — humr writes a
  // host entry with `oauth_token: humr:sentinel` and the gateway swaps
  // it on requests to metadata.baseUrl. GH_TOKEN deliberately not
  // exported here: gh CLI reads it for github.com only, so setting it
  // for enterprise makes `gh auth status` claim github.com is
  // configured even when it isn't.
  envMappings: [],
};
