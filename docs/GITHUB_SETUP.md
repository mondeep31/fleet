# GitHub login and repository access

Fleet separates authentication from repository access. Signing in requests only
`read:user` and `user:email`. A user connects repositories later through a separate
GitHub App, choosing which repositories Fleet can read and deploy.

## 1. Keep the login OAuth App

Use the existing login OAuth App, or create one under
[Developer settings → OAuth Apps](https://github.com/settings/developers).
Its authorization callback URL must match `GITHUB_LOGIN_CALLBACK_URL`:

```dotenv
GITHUB_LOGIN_CLIENT_ID=your_login_oauth_client_id
GITHUB_LOGIN_CLIENT_SECRET=your_login_oauth_client_secret
GITHUB_LOGIN_CALLBACK_URL=https://api.example.com/v1/auth/github/callback
```

The login token is used to fetch profile and verified email, then discarded.
Signing in never creates or overwrites a repository connection.

## 2. Create one new GitHub App for repositories

Create a **GitHub App**, separate from the login OAuth App, at
[Developer settings → GitHub Apps → New](https://github.com/settings/apps/new).
Choose a name such as `Fleet Repositories` (GitHub app names must be unique).

| GitHub setting | Value |
| --- | --- |
| Homepage URL | Your public Fleet dashboard URL |
| Callback URL | `https://api.example.com/api/v1/integrations/github/callback` |
| Expire user authorization tokens | Enabled |
| Request user authorization (OAuth) during installation | **Disabled** — Fleet starts authorization after the setup redirect |
| Enable Device Flow | Disabled |
| Setup URL | `https://api.example.com/api/v1/integrations/github/setup` |
| Redirect on update | Enabled |
| Webhook active | Enabled |
| Webhook URL | `https://api.example.com/webhooks/github` |
| Webhook secret | The same value as `GITHUB_WEBHOOK_SECRET` |
| Repository permissions → Contents | **Read-only** |
| Repository permissions → Metadata | Read-only (automatically required by GitHub) |
| Other repository, organization, and account permissions | No access |
| Subscribe to events | **Push** |
| Where can this GitHub App be installed? | Any account, if other users/organizations will connect repositories |

Replace `https://api.example.com` with your public API origin. Keep callback URL
matching exact; wildcard callbacks are unnecessary. For local development, expose
the API with an HTTPS tunnel and use that origin in all three GitHub URLs and in
`API_URL`. A webhook cannot reach localhost directly.

The dashboard proxies `/api/v1/integrations/github/setup` and
`/api/v1/integrations/github/callback` to the API, so these URLs also work when
your dashboard and public API use the same domain.

Fleet uses the app-level push webhook, so the new App does **not** need
Administration or Webhooks write permissions. It cannot push code, change repo
settings, or manage per-repository hooks with these permissions.

## 3. Set the environment

After creating the App, open its **General** settings, scroll to **Private keys**,
and click **Generate a private key**. GitHub requires a generated key before it
allows installation. Save the downloaded `.pem` file securely; Fleet's current
implementation does not load this key or need a private-key environment variable.

Copy the new app's **Client ID**, generate a **client secret** using
**Generate a new client secret**, and take the **slug** from its public URL,
`https://github.com/apps/YOUR-SLUG`.

```dotenv
# API and deployment worker:
GITHUB_APP_CLIENT_ID=your_new_github_app_client_id
GITHUB_APP_CLIENT_SECRET=your_new_github_app_client_secret

# API:
GITHUB_APP_SLUG=your-fleet-repositories-app
GITHUB_APP_CALLBACK_URL=https://api.example.com/api/v1/integrations/github/callback
GITHUB_OAUTH_SUCCESS_REDIRECT=https://fleet.example.com/connections
GITHUB_WEBHOOK_SECRET=your_random_webhook_secret
API_URL=https://api.example.com
DASHBOARD_URL=https://fleet.example.com
```

The new App's numeric App ID and generated private key are not used at runtime by
this implementation; generating the key is still necessary for GitHub's installation setup.
Fleet uses GitHub App **user access tokens**, which combine the app's repository
selection and read-only permissions with the connected user's own access. Both
access and refresh tokens are encrypted at rest. The API and worker share refresh
logic and serialize rotation through MongoDB so simultaneous requests do not reuse
a refresh token. Refresh authorization eventually expires or can be revoked;
users then reconnect through Connections.

Install dependencies with `bun install` for the new `@fleet/github` workspace,
and restart **both API and worker** after configuring these values. No manual
MongoDB migration is needed; new Integration fields are optional for old records.
Login works without repository App credentials, but starting a new repository
connection returns `GITHUB_APP_NOT_CONFIGURED` until all four App variables are set.

## 4. Connect selected repositories inside Fleet

1. Sign in. GitHub requests profile and email access only.
2. Open **Connections → Connect**, or create a project and choose **Connect GitHub**.
3. Authorize the GitHub App. Fleet checks for an existing installation and
   connects it immediately when available.
4. If no installation exists, choose the account/organization and **Only select
   repositories**, select the repositories to deploy, and install the App.
5. Fleet lists only repositories available to both the installation and that user.
6. Use **Manage repositories** in Connections or **Add repository access** in
   the project picker to change the selection or connect another organization.

Connections verifies access with GitHub and displays **Limited repository access**,
the number of available repositories, and the actual Contents permission. If an
installation grants all repositories, that broader selection is labeled instead.
The connection and repository list refresh when users return to Fleet.

Connect and repository-access controls open GitHub in a popup. Completion returns
to Fleet's dashboard, notifies the original page, refreshes its GitHub data, and
closes the popup. The project picker stays open during this flow. Same-origin
messages and BroadcastChannel handle the notification, including browsers that
isolate the popup's opener. If popups are blocked, the normal page redirect works
as a fallback. No additional GitHub App settings or environment variables are
needed for popup support; keep the same callback and setup URLs.

The normal **Connect** button handles already-installed Apps, including when Fleet
has no stored connection. Authorization verifies the GitHub user and existing
installations, then saves the connection without reopening installation settings.
Fresh installs return through the setup URL to complete authorization; a missing
or suspended installation after that step reports an error instead of looping.

**Can’t see your repository? Add repository access** uses the separate `/install`
flow to open GitHub's installation
picker/settings. After saving and authorizing, Fleet returns to Connections or
the new-project picker, whichever initiated the change. The return page is stored
with the nonce and, for state-less GitHub updates, in a short-lived HttpOnly
dashboard cookie. Only these two internal return paths are accepted.

If an installation/update started directly from GitHub has no Fleet `state`,
the setup endpoint resumes authorization through the signed-in Fleet session.
Users without a valid Fleet session are sent to login. The supplied installation
ID is never used to choose which Fleet user receives the connection.

If GitHub keeps you on its settings page after saving, verify **Setup URL** is
filled in, **Redirect on update** is checked, and **Request user authorization
(OAuth) during installation** is unchecked. The callback URL alone does not
control installation or repository-selection update redirects.

GitHub also offers “All repositories”; users can choose it explicitly. The app
itself still has only the read permissions configured above. Organization policy
may require an owner to approve installation before repos become available.

Fleet never trusts an `installation_id` supplied by the browser. It authorizes the
GitHub user and checks installations/repositories through GitHub's authenticated
API. Repository metadata, branch/Dockerfile checks, and worker clones also verify
selection, including public repositories. Removing a repository from the App
prevents future Fleet access/deployments; it does not stop a container already
running from a previous deployment.

Disconnecting in Fleet revokes that user's authorization and removes the local
connection. It does not uninstall a shared organization App. To remove its
installation and webhook deliveries, configure/uninstall it in GitHub's
**Settings → Applications → Installed GitHub Apps**.

## Existing users and broad OAuth grants

Existing encrypted OAuth connections continue to deploy during migration. They
show **Reconnect GitHub** in Connections; reconnecting replaces their stored token
with the new App authorization. Legacy `GITHUB_CLIENT_ID` and
`GITHUB_CLIENT_SECRET` are optional and are only used to revoke an old OAuth grant
when disconnecting an old connection. `GITHUB_OAUTH_CALLBACK_URL` is obsolete;
configure `GITHUB_APP_CALLBACK_URL` instead.

Changing requested login scopes does **not** revoke permissions granted in the
past. After migrating repository access, users who previously approved broad
permissions should revoke the old repository OAuth App and the old login OAuth
grant under **GitHub Settings → Applications → Authorized OAuth Apps**, then sign
in again to grant just profile/email. Verify the new App deployment first: an old
connection issued by the login App still depends on that old grant until migrated.

Legacy per-repository push hooks also remain on GitHub after migration. Remove
old hooks pointing at Fleet from the repository's **Settings → Webhooks** after
verifying the GitHub App webhook works, to avoid duplicate deliveries. Only remove
hooks that no other legacy Fleet project/connection still relies on.

## Smoke test after configuration

- Use an account with no existing Fleet grant and confirm login requests only
  profile/email, with Connections initially disconnected.
- Install the repository App on one private test repo; confirm unselected repos
  are absent, including in search.
- Create and deploy a project; confirm no per-repository webhook is created.
- Push to the tracked branch and confirm the app webhook starts a deployment.
- Add/remove a repo through Manage repositories; confirm the picker reflects it
  and an existing project's next deploy fails after its repo is removed.
- Disconnect/reconnect and confirm repository access changes independently of
  signing in. Revoking the GitHub App authorization prevents future deployments.

References: [GitHub Apps versus OAuth Apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps),
[GitHub App setup URL](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/about-the-setup-url),
[GitHub App user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app),
[permissions for Git access](https://docs.github.com/en/enterprise-cloud%40latest/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app#choosing-permissions-for-git-access).
