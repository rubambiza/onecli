import type { AppDefinition } from "./types";
import {
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  googleConfigFields,
  googleEnvDefaults,
  googleWorkspaceEnvMappings,
} from "./google-oauth";

export const googleHealth: AppDefinition = {
  id: "google-health",
  name: "Google Health",
  icon: "/icons/google-health.svg",
  description:
    "Access activity, sleep, and health metrics from Fitbit and connected devices.",
  connectionMethod: {
    type: "oauth",
    defaultScopes: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
      "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
      "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
    ],
    permissions: [
      {
        scope:
          "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
        name: "Activity & fitness",
        description: "Steps, exercise, and activity data",
        access: "read",
      },
      {
        scope: "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
        name: "Sleep",
        description: "Sleep stages, duration, and quality data",
        access: "read",
      },
      {
        scope:
          "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
        name: "Health metrics",
        description: "Body metrics such as weight, body fat, and heart rate",
        access: "read",
      },
      {
        scope:
          "https://www.googleapis.com/auth/googlehealth.nutrition.readonly",
        name: "Nutrition",
        description: "Logged food and nutrition data",
        access: "read",
      },
      {
        scope: "https://www.googleapis.com/auth/googlehealth.location.readonly",
        name: "Exercise location",
        description: "GPS tracks recorded during exercise",
        access: "read",
      },
      {
        scope: "https://www.googleapis.com/auth/googlehealth.profile.readonly",
        name: "Profile",
        description: "Health profile details",
        access: "read",
      },
      {
        scope: "https://www.googleapis.com/auth/userinfo.email",
        name: "Email address",
        description: "View your email address",
        access: "read",
      },
      {
        scope: "https://www.googleapis.com/auth/userinfo.profile",
        name: "Profile",
        description: "Name and profile picture",
        access: "read",
      },
    ],
    buildAuthUrl: buildGoogleAuthUrl,
    exchangeCode: exchangeGoogleCode,
  },
  available: true,
  configurable: {
    fields: googleConfigFields,
    envDefaults: googleEnvDefaults,
  },
  envMappings: googleWorkspaceEnvMappings,
};
