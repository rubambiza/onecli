import { ServiceError } from "@/lib/services/errors";

const SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i;

export const normalizeBaseUrl = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new ServiceError("BAD_REQUEST", "Enterprise URL is required");
  }

  // Auto-prefix https:// when the user omits a scheme.
  // An explicit http:// (or anything other than https://) is still rejected.
  const withScheme = SCHEME_RE.test(trimmed) ? trimmed : `https://${trimmed}`;

  if (!withScheme.toLowerCase().startsWith("https://")) {
    throw new ServiceError("BAD_REQUEST", "Enterprise URL must use https://");
  }

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new ServiceError("BAD_REQUEST", "Enterprise URL is not a valid URL");
  }

  if (!parsed.host) {
    throw new ServiceError(
      "BAD_REQUEST",
      "Enterprise URL must include a host (e.g. github.example.com)",
    );
  }

  if (parsed.pathname !== "/" && parsed.pathname !== "") {
    throw new ServiceError(
      "BAD_REQUEST",
      "Enterprise URL must not contain a path (e.g. github.example.com)",
    );
  }

  if (parsed.search || parsed.hash) {
    throw new ServiceError(
      "BAD_REQUEST",
      "Enterprise URL must not contain query or fragment",
    );
  }

  return `${parsed.protocol}//${parsed.host}`;
};
