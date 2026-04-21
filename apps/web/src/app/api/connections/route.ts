import { NextRequest, NextResponse } from "next/server";
import { resolveApiAuth } from "@/lib/api-auth";
import { handleServiceError, unauthorized } from "@/lib/api-utils";
import { apps } from "@/lib/apps/registry";
import { listConnections } from "@/lib/services/connection-service";

export const GET = async (request: NextRequest) => {
  try {
    const auth = await resolveApiAuth(request);
    if (!auth) return unauthorized();

    // Join the app registry so callers can render "Google Drive" and know
    // which env vars to inject into granted agents — both are provider-level
    // facts that belong next to the registry entry, not duplicated per row.
    const appById = new Map(apps.map((a) => [a.id, a]));
    const connections = await listConnections(auth.accountId);
    const enriched = connections.map((c) => {
      const app = appById.get(c.provider);
      return {
        ...c,
        providerName: app?.name ?? null,
        envMappings: app?.envMappings ?? null,
      };
    });
    return NextResponse.json(enriched);
  } catch (err) {
    return handleServiceError(err);
  }
};
