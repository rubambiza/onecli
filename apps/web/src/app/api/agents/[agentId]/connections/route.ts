import { NextRequest, NextResponse } from "next/server";
import { resolveApiAuth } from "@/lib/api-auth";
import { handleServiceError, unauthorized } from "@/lib/api-utils";
import { invalidateGatewayCache } from "@/lib/gateway-invalidate";
import {
  getAgentAppConnections,
  updateAgentAppConnections,
} from "@/lib/services/agent-service";
import { updateAgentAppConnectionsSchema } from "@/lib/validations/agent";

type Params = { params: Promise<{ agentId: string }> };

export const GET = async (request: NextRequest, { params }: Params) => {
  try {
    const auth = await resolveApiAuth(request);
    if (!auth) return unauthorized();

    const { agentId } = await params;
    const appConnectionIds = await getAgentAppConnections(
      auth.accountId,
      agentId,
    );
    return NextResponse.json(appConnectionIds);
  } catch (err) {
    return handleServiceError(err);
  }
};

export const PUT = async (request: NextRequest, { params }: Params) => {
  try {
    const auth = await resolveApiAuth(request);
    if (!auth) return unauthorized();

    const { agentId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updateAgentAppConnectionsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
        { status: 400 },
      );
    }

    await updateAgentAppConnections(
      auth.accountId,
      agentId,
      parsed.data.appConnectionIds,
    );
    invalidateGatewayCache(request);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleServiceError(err);
  }
};
