# AnyDownloader Security Hardening Plan

## Repository

- Repository: `NeoTato/AnyDownloader`
- Application type: Local Electron desktop application
- Primary platform: Windows
- Main technologies: Electron, React, TypeScript, yt-dlp, FFmpeg

## Objective

Harden AnyDownloader for safe personal/local use.

This application is local-only, but it still:

- Downloads and executes native binaries.
- Processes untrusted URLs and media files.
- Uses yt-dlp and FFmpeg to process external content.
- Optionally reads browser cookies.
- Performs filesystem operations.
- Exposes privileged operations through Electron IPC.

Do not add a backend, authentication system, or unnecessary server infrastructure. Focus on local application security, software supply-chain security, privacy, input validation, and Electron hardening.

---

# Priority Summary

## Critical

1. Verify downloaded yt-dlp binaries before executing them.
2. Validate all IPC data at runtime.
3. Restrict accepted URLs.
4. Prevent arbitrary filesystem access through IPC.
5. Make browser-cookie access explicitly opt-in.
6. Tighten the Content Security Policy.
7. Add timeouts and resource limits for yt-dlp operations.

## Important

8. Harden temporary-file cleanup.
9. Prevent unsafe Electron navigation.
10. Improve logging so cookies and sensitive paths are never exposed.
11. Add security-focused tests.
12. Add dependency and release-security checks.

## Optional

13. Add application signing documentation.
14. Add stronger settings/history integrity protection.
15. Investigate Electron sandboxing and process isolation.

---

# Phase 0: Establish a Baseline

## Step 0.1: Inspect the current implementation

Review these files before changing code:

- `electron/main.ts`
- `electron/preload.ts`
- `electron/binManager.ts`
- `electron/ytdlpRunner.ts`
- `electron/store.ts`
- `src/types/index.ts`
- `index.html`
- `package.json`
- `package-lock.json`
- `.github/workflows/*`, if present

Identify:

- All IPC handlers.
- All filesystem operations.
- All child-process execution.
- All external network requests.
- All cookie-related functionality.
- All places where user-controlled values are passed to yt-dlp or FFmpeg.
- All paths supplied from the renderer process.

## Step 0.2: Run baseline commands

Run:

```bash
npm ci
npm run build
npm audit --omit=dev
```

If the project does not currently have a typecheck script, add one:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

Then run:

```bash
npm run typecheck
```

Document any pre-existing failures separately from security changes.

## Step 0.3: Create security documentation

Create `SECURITY.md` containing:

- Supported versions.
- Vulnerability-reporting instructions.
- A warning that browser cookies can grant access to logged-in accounts.
- A warning that the application executes native binaries.
- A recommendation not to run the application as administrator.
- A description of the trusted components:
  - Electron.
  - yt-dlp.
  - FFmpeg.
  - GitHub release downloads.
  - npm dependencies.

---

# Phase 1: Add Shared Security Utilities

Create a shared module such as:

```text
electron/security.ts
```

Do not duplicate security logic across multiple IPC handlers.

The module should provide helpers for:

- URL validation.
- File-path validation.
- Download-path validation.
- Filename sanitization.
- IPC payload validation.
- Cookie-source validation.
- Approved-directory checks.
- Safe error formatting.

Use a runtime validation library such as Zod if appropriate. TypeScript interfaces alone are not sufficient because IPC data arrives at runtime.

---

# Phase 2: Validate URLs

## Step 2.1: Add URL validation

Create a helper similar to:

```ts
validateMediaUrl(value: unknown): URL
```

Rules:

- The value must be a string.
- Trim whitespace.
- Reject empty strings.
- Accept only `http:` and `https:`.
- Reject:
  - `file:`
  - `javascript:`
  - `data:`
  - `blob:`
  - `ftp:`
  - Custom schemes
- Reject malformed URLs.
- Reject URLs containing embedded usernames or passwords.
- Enforce a maximum URL length.
- Decide how to handle localhost, loopback, private IP, link-local, and unspecified IP addresses.

Recommended default:

- Allow normal public media URLs.
- Reject obvious local-network and loopback targets.
- Document any exceptions required by yt-dlp compatibility.

Do not create a short hard-coded platform allowlist unless required. AnyDownloader supports many platforms, so validate the URL structure and scheme rather than blocking most websites.

## Step 2.2: Use URL validation everywhere

Apply URL validation before:

- `inspect-url`
- `start-download`
- Re-download from history
- Playlist entry downloads
- Any future external navigation

Never pass an unvalidated URL directly to yt-dlp.

---

# Phase 3: Validate IPC Requests

All renderer-to-main IPC requests must be validated in the main process.

Validate these handlers at minimum:

- `inspect-url`
- `start-download`
- `cancel-download`
- `save-settings`
- `delete-history-item`
- `open-path`
- `show-in-folder`

## Step 3.1: Validate `inspect-url`

Requirements:

- Validate the URL.
- Enforce a maximum URL length.
- Add a timeout.
- Limit output size.
- Limit the number of playlist entries.
- Kill the child process if the timeout expires.
- Truncate stderr before returning it to the renderer.
- Never return cookies, cookie contents, or unnecessary local paths.

## Step 3.2: Validate `start-download`

Validate:

- `id`
- `url`
- `title`
- `customFilename`
- `mode`
- `videoQuality`
- `videoContainer`
- `audioFormat`
- `audioBitrate`
- `downloadPath`
- `speedLimit`
- `clipRange`
- `customMetadata`
- Boolean options
- Maximum string lengths

Reject unknown enum values instead of forwarding them to yt-dlp.

Enforce safe bounds for:

- Maximum concurrent downloads.
- Maximum playlist size.
- Maximum title length.
- Maximum metadata length.
- Maximum filename length.
- Maximum clip duration.
- Maximum download size, if practical.
- Maximum number of subtitles or formats processed.

## Step 3.3: Validate settings

Do not blindly merge renderer-supplied settings:

```ts
this.settings = { ...this.settings, ...newSettings };
```

Instead:

1. Validate the incoming object.
2. Keep only recognized fields.
3. Validate each field’s type and allowed values.
4. Clamp numeric values to safe ranges.
5. Reject malformed settings.

Important fields include:

- `defaultDownloadPath`
- `cookieSource`
- `cookieFilePath`
- `maxConcurrentDownloads`
- `downloadSpeedLimit`
- `enableNotifications`
- `autoPasteClipboard`

---

# Phase 4: Harden the Electron Boundary

## Step 4.1: Validate IPC senders

Before handling privileged IPC requests, verify that the request came from the expected application window.

Accept only:

- The packaged local application page.
- The expected Vite development origin during development.

Reject:

- Unexpected remote origins.
- Detached windows.
- Destroyed web contents.
- Requests from unexpected frames.

## Step 4.2: Prevent remote navigation

In `electron/main.ts`:

- Handle `will-navigate`.
- Prevent navigation to unexpected URLs.
- Handle `setWindowOpenHandler`.
- Deny unexpected popup windows.
- Do not allow the Electron window to become a general-purpose browser.

If external links must be opened, use `shell.openExternal()` only after validating that the URL is HTTPS.

Do not load arbitrary user-controlled URLs inside the Electron window.

## Step 4.3: Preserve secure BrowserWindow settings

Keep:

```ts
webPreferences: {
  preload,
  nodeIntegration: false,
  contextIsolation: true,
  webSecurity: true
}
```

Investigate whether the following can be enabled without breaking the preload implementation:

```ts
sandbox: true
```

Do not expose these to the renderer:

- `ipcRenderer`
- `fs`
- `path`
- `child_process`
- Generic command execution
- Generic file reading
- Generic file writing

The preload API should remain a small allowlisted interface.

---

# Phase 5: Harden Filesystem Operations

## Step 5.1: Create approved-path helpers

Use `path.resolve()` and `path.relative()` to verify path containment.

Do not use naive string-prefix checks such as:

```ts
filePath.startsWith(downloadPath)
```

because `/downloads-other` could incorrectly match `/downloads`.

Create helpers such as:

```ts
isInsideDirectory(targetPath, approvedDirectory)
isApprovedDownloadPath(targetPath, settings)
isRegularFile(targetPath)
```

Account for:

- `..` traversal.
- Symbolic links.
- Junctions on Windows.
- Case-insensitive Windows paths.
- Similar directory names.
- Missing files.

## Step 5.2: Harden `open-path`

The `open-path` IPC handler must:

- Require a non-empty string.
- Resolve the path.
- Require the target to exist.
- Require the target to be a regular file.
- Allow only files inside the configured download directory.
- Optionally allow files recorded in application history.
- Reject executables, scripts, and arbitrary system files.
- Never open arbitrary renderer-supplied paths.

Do not allow the renderer to use this API to open:

```text
C:\Windows\System32
C:\Users\<user>\AppData
C:\Program Files
```

unless the path is explicitly approved for a necessary application feature.

## Step 5.3: Harden `show-in-folder`

Apply the same checks as `open-path`.

If the target file is missing:

- Resolve its parent directory.
- Ensure the parent remains inside the approved download directory.
- Open only the approved parent directory.
- Do not open arbitrary parent directories.

## Step 5.4: Harden temporary-file cleanup

The cleanup feature should:

- Scan only direct children of the configured download directory.
- Never recursively delete arbitrary directories.
- Never follow symbolic links or junctions.
- Delete only exact temporary-file patterns created by the app.
- Re-check the resolved path immediately before deletion.
- Handle races where a file disappears between checking and deleting.
- Never delete a path outside the approved directory.

Allowed temporary patterns should be narrowly defined, for example:

```text
*.part
*.ytdl
*.temp.*
```

Do not delete files merely because their names contain a broad substring unless that behavior is necessary and carefully bounded.

---

# Phase 6: Harden yt-dlp and Download Operations

## Step 6.1: Add metadata-inspection timeouts

For `inspectUrl`:

- Set a maximum execution time.
- Kill the child process on timeout.
- Limit stdout and stderr buffers.
- Reject excessive playlist metadata.
- Reject excessive JSON output.
- Do not allow an inspection process to run indefinitely.

Use a safe error such as:

```text
Media inspection timed out.
```

Do not return raw command output if it may contain sensitive information.

## Step 6.2: Add download resource limits

Add safe defaults for:

- Maximum simultaneous downloads.
- Maximum playlist entries.
- Maximum media duration.
- Maximum output file size, if practical.
- Maximum metadata size.
- Maximum subtitle size.
- Maximum number of retry attempts.
- Maximum process duration.

These limits should be configurable where useful, but defaults must be safe.

## Step 6.3: Use safe child-process APIs

Continue using `spawn()` with argument arrays.

Do not construct shell commands from user input.

Avoid patterns such as:

```ts
exec(`some-command ${userInput}`)
```

For Windows process termination:

- Ensure the PID is numeric and comes from the child process.
- Do not include user-controlled strings in the termination command.
- Prefer an argument-array API if supported.
- Preserve process-tree cancellation behavior.

## Step 6.4: Bound process output

Do not allow unlimited stdout/stderr accumulation.

Implement a bounded buffer:

- Keep only the last or first configured number of bytes.
- Truncate output with a clear marker.
- Avoid logging complete yt-dlp command lines.
- Never log cookie arguments or cookie file paths.

## Step 6.5: Treat metadata as untrusted

Titles, uploader names, subtitles, descriptions, filenames, and thumbnails must be treated as untrusted data.

- Do not use `dangerouslySetInnerHTML`.
- Render metadata as normal React text.
- Sanitize or reject control characters.
- Limit metadata length.
- Sanitize filenames before constructing output paths.
- Do not interpret metadata as shell syntax.

---

# Phase 7: Browser Cookie Safety

## Step 7.1: Keep cookies disabled by default

The default must remain:

```ts
cookieSource: "none"
```

The application must not automatically read browser profiles.

## Step 7.2: Add explicit confirmation

When a user selects a browser cookie source, show a confirmation warning:

> Browser cookies may contain active login sessions. Enabling this feature allows yt-dlp to use authenticated browser data for downloads. Only enable it when necessary and only for sources you trust.

Require explicit confirmation before enabling a browser source.

## Step 7.3: Prefer narrowly scoped cookie files

Prefer a user-selected exported cookie file over automatically reading a complete browser profile.

Validate cookie files:

- Must be a regular file.
- Must be inside an allowed user-selected location.
- Do not copy the contents.
- Do not upload the file.
- Do not include the contents in logs.
- Do not display cookie contents in the UI.

## Step 7.4: Prevent cookie leakage

Never log:

- Cookie file contents.
- Cookie arguments.
- Browser profile paths unless absolutely necessary.
- Complete command lines containing cookie paths.

Do not include cookies in:

- Error messages.
- Progress messages.
- History records.
- Telemetry.
- Crash reports.

Use cookie arguments only for the specific yt-dlp operation requested by the user.

Do not use cookies for:

- yt-dlp updates.
- FFmpeg updates.
- Generic application network requests.
- Unrelated metadata operations.

---

# Phase 8: Secure yt-dlp Binary Updates

This is a critical supply-chain requirement.

The application currently downloads an executable from a mutable URL similar to:

```ts
const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${filename}`;
```

HTTPS alone is not enough. The binary must be verified before execution.

## Step 8.1: Pin a version

Do not rely only on `releases/latest`.

Define a central version:

```ts
const YTDLP_VERSION = "REPLACE_WITH_APPROVED_VERSION";
```

Use a versioned release URL where possible.

When updating versions, change the version and expected checksum together.

## Step 8.2: Download the expected checksum

Use the official yt-dlp release checksum file or official signature mechanism.

The implementation must not invent or hard-code an unverified checksum.

If the upstream project’s official checksum/signature format is unclear, stop and document the limitation rather than pretending the implementation is secure.

## Step 8.3: Verify SHA-256

The updater must:

1. Download the binary to a temporary file.
2. Download the official checksum data.
3. Calculate the temporary file’s SHA-256 hash.
4. Compare it to the expected hash.
5. Reject the binary if the hash does not match.
6. Never execute or install a failed verification result.

Example implementation shape:

```ts
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

async function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}
```

## Step 8.4: Validate redirects

If the downloader follows redirects:

- Require HTTPS.
- Limit the redirect count.
- Allow only approved hosts.
- Reject redirects to arbitrary domains.
- Validate every redirect destination.
- Abort on redirect loops.

Approved hosts should be explicitly configured, for example:

```text
github.com
objects.githubusercontent.com
```

Use the exact hosts required by the official release process, not a wildcard such as `https://*`.

## Step 8.5: Limit download size

The updater must:

- Enforce a maximum binary size.
- Reject unexpected `Content-Length` values.
- Abort if the stream exceeds the maximum size.
- Handle incomplete responses.
- Use a network timeout.
- Delete temporary files after failure.

## Step 8.6: Use atomic replacement

The safe update flow is:

1. Download to `yt-dlp.exe.tmp`.
2. Verify size and checksum.
3. Run a version check on the temporary binary.
4. Rename the current binary to a backup.
5. Atomically rename the verified temporary binary into place.
6. If replacement fails, restore the backup.
7. Delete the temporary file.
8. Keep the last known-good version until the new version passes validation.

A failed update must never destroy the existing working binary.

## Step 8.7: Do not silently trust PATH binaries

Choose and document one policy:

### Recommended policy

Use only application-managed, verified binaries.

### Compatibility policy

If system PATH binaries are allowed:

- Show their resolved path.
- Show their version.
- Require explicit user approval.
- Reject unexpected locations.
- Document that system binaries are outside the application’s verification boundary.

Do not silently execute an unknown PATH binary.

## Step 8.8: Apply the same policy to FFmpeg

If FFmpeg is downloaded or bundled in the future, use the same:

- Pinned version.
- Official source.
- Checksum/signature verification.
- Size limits.
- Atomic replacement.
- Rollback behavior.

---

# Phase 9: Tighten the Content Security Policy

The current policy is too permissive:

```html
default-src 'self' 'unsafe-inline' 'unsafe-eval' https://* data: blob:;
```

Replace it with a restrictive policy appropriate for the actual application.

Suggested starting point:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; connect-src 'self' https://github.com https://*.googlevideo.com; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none';"
/>
```

Then test the application and remove hosts that are not required.

Requirements:

- Remove `'unsafe-eval'`.
- Avoid `https://*`.
- Do not allow arbitrary frames.
- Do not allow plugins or objects.
- Do not use inline scripts.
- Use a development-only relaxed policy only if Vite requires it.
- Keep the production policy restrictive.

If possible, bundle fonts locally and remove Google Fonts from the production policy.

---

# Phase 10: Dependency and Build Security

## Step 10.1: Audit dependencies

Run:

```bash
npm audit
npm audit --omit=dev
npm outdated
```

Review vulnerabilities in:

- Electron.
- Electron plugins.
- electron-builder.
- Vite.
- React.
- Process-management packages.
- Archive and filesystem packages.

Do not blindly apply major upgrades. Document compatibility decisions.

## Step 10.2: Use clean, reproducible installs

CI and release builds should use:

```bash
npm ci
npm run typecheck
npm run build
```

Commit and review `package-lock.json`.

## Step 10.3: Add CI security checks

Add a workflow that runs:

```bash
npm ci
npm run typecheck
npm run build
npm audit --omit=dev
```

If `npm audit` has known accepted findings, document them explicitly instead of hiding the result.

## Step 10.4: Release security

Document that release builds should:

- Be created from a clean checkout.
- Use `npm ci`.
- Be scanned with antivirus.
- Be checked with dependency scanners.
- Include SHA-256 checksums.
- Include the source commit.
- Be Authenticode-signed when possible.

Do not claim that an installer is signed unless signing has actually been performed.

---

# Phase 11: Add Tests

Add tests for the security-critical utilities and IPC handlers.

## URL tests

Test that:

- HTTPS URLs are accepted.
- HTTP URLs are accepted if supported.
- `file:` URLs are rejected.
- `javascript:` URLs are rejected.
- `data:` URLs are rejected.
- Malformed URLs are rejected.
- URLs with credentials are rejected.
- Excessively long URLs are rejected.
- Loopback/private URLs follow the documented policy.

## Path tests

Test that:

- Files inside the download directory are accepted.
- Files outside the download directory are rejected.
- Similar-prefix paths are rejected.
- `..` traversal is rejected.
- Symlink and junction behavior is safe.
- System files are rejected by open-file handlers.
- Cleanup cannot escape the configured directory.

## IPC tests

Test that:

- Missing payloads are rejected.
- Unknown fields are ignored or rejected consistently.
- Invalid enum values are rejected.
- Invalid paths are rejected.
- Invalid URLs are rejected.
- Invalid sender origins are rejected.
- Excessive metadata is rejected.
- Invalid IDs are rejected.

## Binary updater tests

Mock the network and test:

- Successful download and checksum verification.
- Checksum mismatch.
- Invalid signature, if signatures are implemented.
- Redirect to an unapproved host.
- Too many redirects.
- Oversized response.
- Truncated response.
- Network timeout.
- Cleanup after failure.
- Existing good binary survives a failed update.
- Temporary binary is not executed before verification.

## Cookie tests

Test that:

- Cookie source defaults to `none`.
- Browser-cookie access requires explicit confirmation.
- Unsupported cookie sources are rejected.
- Missing cookie files are rejected.
- Cookie contents are never logged.
- Cookie paths are not included in user-facing errors unnecessarily.

## Process tests

Test that:

- Metadata inspection times out.
- Timed-out child processes are killed.
- Download cancellation removes the process from tracking.
- stderr buffers are bounded.
- Failed processes do not create history entries.
- Child processes are cleaned up on every exit path.

---

# Phase 12: Update Documentation

Update `README.md` or `DOCUMENTATION.md` with:

- Local-only does not mean risk-free.
- The app executes yt-dlp and FFmpeg locally.
- URLs and downloaded media are untrusted input.
- Browser-cookie access is sensitive and disabled by default.
- The updater verifies downloaded binaries.
- Users should not run the app as administrator.
- Users should keep the app and engines updated.
- Release binaries should come from trusted sources.
- Settings and history are stored locally.
- The application does not provide isolation from compromised local dependencies.

Add this warning to the settings documentation:

> Browser-cookie access can expose active login sessions to yt-dlp. Enable it only when necessary and only for websites and downloads you trust.

---

# Recommended Implementation Order

Implement the work in small commits in this order:

1. Fix any existing compilation errors.
2. Establish a passing `npm ci` and `npm run build`.
3. Add shared URL and path-validation helpers.
4. Add runtime IPC payload validation.
5. Validate IPC sender origins.
6. Harden `open-path` and `show-in-folder`.
7. Harden temporary-file cleanup.
8. Add inspection timeouts and output limits.
9. Add download resource limits.
10. Add cookie confirmation and privacy-safe logging.
11. Implement pinned and verified yt-dlp updates.
12. Add redirect, size, timeout, and rollback handling.
13. Tighten the production CSP.
14. Prevent unexpected Electron navigation.
15. Add security-focused tests.
16. Add dependency and CI checks.
17. Update `SECURITY.md`, `README.md`, and `DOCUMENTATION.md`.
18. Perform manual verification.

---

# Acceptance Criteria

The implementation is complete only when:

- `npm ci` succeeds.
- `npm run typecheck` succeeds.
- `npm run build` succeeds.
- Security tests pass.
- A normal public media URL still works.
- A valid playlist works within configured limits.
- Download cancellation still works on Windows.
- Normal app-managed files can be opened.
- Arbitrary paths are rejected.
- Unsupported URL schemes are rejected.
- Browser cookies are disabled by default.
- Cookie access requires explicit confirmation.
- Cookie contents and sensitive paths are not logged.
- A checksum mismatch prevents yt-dlp installation.
- A failed update preserves the previous working binary.
- Redirects to unapproved hosts are rejected.
- Oversized or incomplete binaries are rejected.
- The production CSP does not contain `'unsafe-eval'` or `https://*`.
- The application does not require administrator privileges.
- Documentation explains the remaining trust assumptions.

---

# Manual Verification Checklist

Perform these checks on a clean Windows user account if possible:

- [ ] Install without administrator privileges.
- [ ] Start with cookies disabled.
- [ ] Inspect a normal HTTPS media URL.
- [ ] Download a normal video.
- [ ] Download a normal audio file.
- [ ] Download a playlist within the configured limit.
- [ ] Cancel a running download.
- [ ] Try a `file://` URL and verify rejection.
- [ ] Try a malformed URL and verify safe failure.
- [ ] Try a loopback or private-network URL and verify documented behavior.
- [ ] Attempt to open a file outside the download directory and verify rejection.
- [ ] Attempt path traversal and verify rejection.
- [ ] Simulate a checksum mismatch and verify the previous binary remains.
- [ ] Simulate an unapproved redirect and verify rejection.
- [ ] Simulate a truncated binary download and verify cleanup.
- [ ] Confirm cookie warning appears before enabling browser access.
- [ ] Confirm no cookie data appears in logs.
- [ ] Confirm no administrator privileges are required.
- [ ] Confirm production CSP is restrictive.
- [ ] Confirm the updater does not use an unverified `latest` binary.
- [ ] Confirm all tests pass.

---

# Agent Constraints

- Do not add a generic shell-command IPC endpoint.
- Do not pass untrusted values into shell command strings.
- Do not log complete yt-dlp command lines if they contain cookie paths.
- Do not log cookie contents.
- Do not trust HTTPS alone for executable downloads.
- Do not install or execute a binary before checksum/signature verification.
- Do not silently replace a working binary with a failed or unverified update.
- Do not use naive path-prefix checks.
- Do not weaken security controls simply to make tests pass.
- Preserve existing functionality where possible.
- Explain behavior changes in the final implementation summary.
- If an upstream checksum or signature cannot be verified reliably, document the limitation and stop rather than claiming the update is secure.