import type { AppDefinition } from "./types";
import { github } from "./github";
import { gmail } from "./gmail";
import { googleAdmin } from "./google-admin";
import { googleAnalytics } from "./google-analytics";
import { googleCalendar } from "./google-calendar";
import { googleClassroom } from "./google-classroom";
import { googleDocs } from "./google-docs";
import { googleDrive } from "./google-drive";
import { googleForms } from "./google-forms";
import { googleHealth } from "./google-health";
import { googleMeet } from "./google-meet";
import { googlePhotos } from "./google-photos";
import { googleSearchConsole } from "./google-search-console";
import { googleSheets } from "./google-sheets";
import { googleSlides } from "./google-slides";
import { googleTasks } from "./google-tasks";
import { resend } from "./resend";
import { spotify } from "./spotify";
import { youtube } from "./youtube";

export const apps: AppDefinition[] = [
  github,
  gmail,
  googleAdmin,
  googleAnalytics,
  googleCalendar,
  googleClassroom,
  googleDocs,
  googleDrive,
  googleForms,
  googleHealth,
  googleMeet,
  googlePhotos,
  googleSearchConsole,
  googleSheets,
  googleSlides,
  googleTasks,
  resend,
  spotify,
  youtube,
];

export const getApp = (id: string): AppDefinition | undefined =>
  apps.find((app) => app.id === id);
