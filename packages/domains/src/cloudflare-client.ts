/**
 * Thin wrapper around the Cloudflare for SaaS custom hostnames API.
 * Docs: https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/domain-support/
 *
 * Requires a one-time, out-of-band zone setup that this client does not do:
 * enabling Cloudflare for SaaS on the zone and setting a fallback origin
 * (a proxied CNAME on the zone pointing at a Cloudflare Tunnel hostname that
 * routes to Traefik). See docs/CONTEXT.md.
 *
 * Lives in a shared package (not apps/api) because the domain-verification
 * sweep in apps/worker needs it too — see sync.ts.
 */

import axios, { isAxiosError } from "axios";
import { getSharedEnv } from "@fleet/config";
import { AppError } from "@fleet/errors";

const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";

export interface CloudflareOwnershipVerification {
  type?: string;
  name?: string;
  value?: string;
}

export interface CloudflareOwnershipVerificationHttp {
  http_url?: string;
  http_body?: string;
}

export interface CloudflareSslValidationRecord {
  txt_name?: string;
  txt_value?: string;
  http_url?: string;
  http_body?: string;
}

export interface CloudflareCustomHostname {
  id: string;
  hostname: string;
  status: string;
  ssl?: {
    status?: string;
    validation_records?: CloudflareSslValidationRecord[];
    validation_errors?: Array<{ message?: string }>;
  };
  ownership_verification?: CloudflareOwnershipVerification;
  ownership_verification_http?: CloudflareOwnershipVerificationHttp;
  verification_errors?: string[];
}

function getClient() {
  const { CLOUDFLARE_API_TOKEN } = getSharedEnv();
  if (!CLOUDFLARE_API_TOKEN) {
    throw new AppError(
      503,
      "Custom domains are not configured on this Fleet instance",
      "CUSTOM_DOMAINS_NOT_CONFIGURED",
    );
  }
  return axios.create({
    baseURL: CLOUDFLARE_API,
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
}

function getZoneId(): string {
  const { CLOUDFLARE_ZONE_ID } = getSharedEnv();
  if (!CLOUDFLARE_ZONE_ID) {
    throw new AppError(
      503,
      "Custom domains are not configured on this Fleet instance",
      "CUSTOM_DOMAINS_NOT_CONFIGURED",
    );
  }
  return CLOUDFLARE_ZONE_ID;
}

interface CloudflareApiResponse<T> {
  success: boolean;
  errors: Array<{ code?: number; message: string }>;
  result: T;
}

async function cfRequest<T>(
  method: "get" | "post" | "delete",
  path: string,
  data?: unknown,
): Promise<T> {
  const client = getClient();
  try {
    const response = await client.request<CloudflareApiResponse<T>>({
      method,
      url: path,
      data,
    });
    if (!response.data.success) {
      const message = response.data.errors.map((e) => e.message).join("; ");
      throw new Error(`Cloudflare API error: ${message}`);
    }
    return response.data.result;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const body = error.response.data as CloudflareApiResponse<unknown> | undefined;
      const message = body?.errors?.map((e) => e.message).join("; ") ?? error.message;
      throw new Error(`Cloudflare API ${path} returned ${error.response.status}: ${message}`);
    }
    throw error;
  }
}

export async function createCustomHostname(
  hostname: string,
): Promise<CloudflareCustomHostname> {
  // "txt" (not "http"): the HTTP-01-style challenge would route through
  // Cloudflare -> the tunnel -> Traefik -> the customer's own app container,
  // which has no way to answer it. TXT validation is fully self-contained
  // in DNS and never needs a request to reach the origin at all.
  return cfRequest<CloudflareCustomHostname>(
    "post",
    `/zones/${getZoneId()}/custom_hostnames`,
    { hostname, ssl: { method: "txt", type: "dv" } },
  );
}

export async function getCustomHostname(
  cloudflareHostnameId: string,
): Promise<CloudflareCustomHostname> {
  return cfRequest<CloudflareCustomHostname>(
    "get",
    `/zones/${getZoneId()}/custom_hostnames/${cloudflareHostnameId}`,
  );
}

/** 404 from Cloudflare (already gone) is treated as success. */
export async function deleteCustomHostname(cloudflareHostnameId: string): Promise<void> {
  try {
    await cfRequest<unknown>(
      "delete",
      `/zones/${getZoneId()}/custom_hostnames/${cloudflareHostnameId}`,
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("returned 404")) return;
    throw error;
  }
}
