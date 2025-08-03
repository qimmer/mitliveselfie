import { revalidate } from "@solidjs/router";
import { getOrganizationRoles } from "~/server/getOrganizationRoles";
import { getRoles } from "~/server/getRoles";
import { getSession } from "~/server/getSession";

export async function login(
  provider: "facebook" | "microsoft" | "credentials" | "google" | "twitch",
  config?: {
    loginReturnUrl?: string;
    logoutReturnUrl?: string;
    email?: string;
    inviteToken?: string;
  },
) {
  const signInUrl = `/api/auth/${provider === "credentials" ? "callback" : "signin"}/${provider}`;
  const csrfTokenResponse = await fetch(`/api/auth/csrf`);
  const { csrfToken } = await csrfTokenResponse.json();

  const res = await fetch(signInUrl, {
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    body: new URLSearchParams({
      ...(config ?? {}),
      csrfToken,
      callbackUrl: config?.loginReturnUrl ?? "/",
    }),
  });

  const data = await res.clone().json();

  const url = data.url ?? data.redirect ?? config?.logoutReturnUrl ?? "/";

  revalidate([getSession.key, getRoles.key, getOrganizationRoles.key]);

  window.location.href = url;
  // If url contains a hash, the browser does not reload the page. We reload manually
  if (url.includes("#")) window.location.reload();
  return;
}
