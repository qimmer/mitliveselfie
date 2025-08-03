export async function logout(config?: {
  loginReturnUrl?: string;
  logoutReturnUrl?: string;
}) {
  const { callbackUrl = config?.logoutReturnUrl ?? "/" } = {};

  const csrfTokenResponse = await fetch(`/api/auth/csrf`);
  const { csrfToken } = await csrfTokenResponse.json();
  const res = await fetch(`/api/auth/signout`, {
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    body: new URLSearchParams({
      csrfToken,
      callbackUrl,
    }),
  });
  const data = await res.json();

  const url = data.url ?? data.redirect ?? config?.logoutReturnUrl ?? "/";

  window.location.href = url;
  // If url contains a hash, the browser does not reload the page. We reload manually
  if (url.includes("#")) window.location.reload();
  return;
}
