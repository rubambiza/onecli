import { NextRequest, NextResponse } from "next/server";
import { resolveApiAuth } from "@/lib/api-auth";
import { handleServiceError, unauthorized } from "@/lib/api-utils";
import { apps } from "@/lib/apps/registry";
import { listConnections } from "@/lib/services/connection-service";

export const GET = async (request: NextRequest) => {
  try {
    const auth = await resolveApiAuth(request);
    if (!auth) return unauthorized();

    // Join the app registry so callers can render "Google Drive" instead of
    // having to make a second request to /api/apps. `connection.label` is the
    // user's identity (email/username), not the app's display name.
    const providerNameById = new Map(apps.map((a) => [a.id, a.name]));
    const connections = await listConnections(auth.accountId);
    const enriched = connections.map((c) => ({
      ...c,
      providerName: providerNameById.get(c.provider) ?? null,
    }));
    return NextResponse.json(enriched);
  } catch (err) {
    return handleServiceError(err);
  }
};
