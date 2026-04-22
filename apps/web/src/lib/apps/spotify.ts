import type { EnvMapping } from "@/lib/env-mapping";
import type { AppDefinition } from "./types";

const spotifyEnvMappings: EnvMapping[] = [
  { envName: "SPOTIFY_ACCESS_TOKEN", placeholder: "humr:sentinel" },
];

export const spotify: AppDefinition = {
  id: "spotify",
  name: "Spotify",
  icon: "/icons/spotify.svg",
  description: "Access playlists, library, top tracks, and listening history.",
  connectionMethod: {
    type: "oauth",
    defaultScopes: [
      "user-read-email",
      "user-read-private",
      "user-library-read",
      "playlist-read-private",
      "playlist-read-collaborative",
      "user-top-read",
      "user-read-recently-played",
      "user-follow-read",
      "user-read-playback-state",
      "user-read-currently-playing",
      "user-read-playback-position",
    ],
    permissions: [
      {
        scope: "user-read-email",
        name: "Email address",
        description: "View your email address",
        access: "read",
      },
      {
        scope: "user-read-private",
        name: "Profile",
        description: "Name, country, and product tier",
        access: "read",
      },
      {
        scope: "user-library-read",
        name: "Library",
        description: "Saved tracks, albums, and episodes",
        access: "read",
      },
      {
        scope: "playlist-read-private",
        name: "Private playlists",
        description: "View your private playlists",
        access: "read",
      },
      {
        scope: "playlist-read-collaborative",
        name: "Collaborative playlists",
        description: "View playlists you collaborate on",
        access: "read",
      },
      {
        scope: "user-top-read",
        name: "Top artists & tracks",
        description: "View your top artists and tracks",
        access: "read",
      },
      {
        scope: "user-read-recently-played",
        name: "Listening history",
        description: "View your recently played tracks",
        access: "read",
      },
      {
        scope: "user-follow-read",
        name: "Followed artists & users",
        description: "View artists and users you follow",
        access: "read",
      },
      {
        scope: "user-read-playback-state",
        name: "Playback state",
        description: "Current player state, active device, and queue",
        access: "read",
      },
      {
        scope: "user-read-currently-playing",
        name: "Currently playing",
        description: "What you're listening to right now",
        access: "read",
      },
      {
        scope: "user-read-playback-position",
        name: "Playback position",
        description: "Resume positions for podcast episodes",
        access: "read",
      },
    ],
    buildAuthUrl: ({ clientId, redirectUri, scopes, state }) => {
      const url = new URL("https://accounts.spotify.com/authorize");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("scope", scopes.join(" "));
      url.searchParams.set("state", state);
      return url.toString();
    },
    exchangeCode: async ({ code, clientId, clientSecret, redirectUri }) => {
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64",
      );
      const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basic}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenRes.ok) {
        throw new Error(
          `Spotify token exchange failed: ${tokenRes.status} ${tokenRes.statusText}`,
        );
      }

      const tokenData = (await tokenRes.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        scope?: string;
        token_type?: string;
        error?: string;
        error_description?: string;
      };

      if (tokenData.error || !tokenData.access_token) {
        throw new Error(
          tokenData.error_description ?? "Failed to exchange code for token",
        );
      }

      const expiresAt = tokenData.expires_in
        ? Math.floor(Date.now() / 1000) + tokenData.expires_in
        : undefined;

      const credentials: Record<string, unknown> = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type,
        expires_at: expiresAt,
      };

      // Spotify returns scopes space-separated.
      const scopes = tokenData.scope?.split(" ").filter(Boolean) ?? [];

      let metadata: Record<string, unknown> | undefined;
      const userRes = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (userRes.ok) {
        const user = (await userRes.json()) as {
          id?: string;
          email?: string;
          display_name?: string;
          images?: { url?: string }[];
        };
        metadata = {
          username: user.id,
          email: user.email,
          name: user.display_name,
          avatarUrl: user.images?.[0]?.url,
        };
      }

      return { credentials, scopes, metadata };
    },
  },
  available: true,
  configurable: {
    fields: [
      {
        name: "clientId",
        label: "Client ID",
        placeholder: "e.g. 1a2b3c4d5e6f7g8h9i0j",
      },
      {
        name: "clientSecret",
        label: "Client Secret",
        placeholder: "Spotify app client secret",
        secret: true,
      },
    ],
    envDefaults: {
      clientId: "SPOTIFY_CLIENT_ID",
      clientSecret: "SPOTIFY_CLIENT_SECRET",
    },
  },
  envMappings: spotifyEnvMappings,
};
