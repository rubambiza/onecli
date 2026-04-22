import type { AppDefinition } from "./types";
import {
  buildGithubAuthUrl,
  exchangeGithubCode,
  githubEnvMappings,
  type GithubOAuthConfig,
} from "./github-oauth";

const CFG: GithubOAuthConfig = {
  baseUrl: "https://github.com",
  apiBase: "https://api.github.com",
};

export const github: AppDefinition = {
  id: "github",
  name: "GitHub",
  icon: "/icons/github.svg",
  darkIcon: "/icons/github-light.svg",
  description: "Repositories, issues, pull requests, and GitHub Actions.",
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
    buildAuthUrl: (params) => buildGithubAuthUrl(CFG, params),
    exchangeCode: (params) => exchangeGithubCode(CFG, params),
  },
  available: true,
  configurable: {
    fields: [
      {
        name: "clientId",
        label: "Client ID",
        placeholder: "Iv1.abc123...",
      },
      {
        name: "clientSecret",
        label: "Client Secret",
        placeholder: "secret_...",
        secret: true,
      },
    ],
    envDefaults: {
      clientId: "GITHUB_CLIENT_ID",
      clientSecret: "GITHUB_CLIENT_SECRET",
    },
  },
  envMappings: githubEnvMappings,
};
