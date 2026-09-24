# AnyDownloader: Remaining Security Work

## Repository

- Repository: `NeoTato/AnyDownloader`
- Latest reviewed commit: `2c52c2e`
- Review date: September 24, 2026
- Application type: Local Electron desktop application
- Main technologies: Electron, React, TypeScript, yt-dlp, FFmpeg

## Summary

The repository now contains a security-hardening plan and documentation, but several important protections are not yet implemented in the application code.

The application is local-only, which reduces server-side risks, but it still:

- Downloads and executes native binaries.
- Processes untrusted URLs and media.
- Uses yt-dlp and FFmpeg.
- Can access browser cookies.
- Performs filesystem operations.
- Exposes privileged functionality through Electron IPC.

The remaining work below should be implemented and tested before considering the application ready for broad distribution.

---

# Priority 1: Secure the yt-dlp updater

## Current issue

`electron/binManager.ts` still downloads yt-dlp using a mutable `releases/latest` URL:

```ts
const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${filename}`;
```

The current updater does not appear to:

- Pin a specific yt-dlp version.
- Download an official checksum file.
- Calculate a SHA-256 hash.
- Compare the downloaded file against the expected hash.
- Verify an official signature.
- Validate redirect destinations.
- Enforce a maximum download size.
- Use a download timeout.
- Preserve the old binary safely if replacement fails.
- Prevent `yt-dlp -U` from replacing the executable without application-level verification.

## Required implementation

Update the binary-management flow so it:

1. Defines a pinned yt-dlp version.
2. Downloads the versioned artifact.
3. Downloads the official checksum or signature data.
4. Calculates the downloaded artifact’s SHA-256 hash.
5. Rejects mismatches.
6. Rejects unexpected redirects.
7. Enforces a maximum response size.
8. Uses a network timeout.
9. Downloads to a temporary file.
10. Verifies the temporary file before executing it.
11. Runs a version check on the temporary binary.
12. Atomically replaces the existing binary.
13. Preserves the previous working binary if anything fails.
14. Cleans up temporary files after success or failure.
15. Does not silently install an unverified binary.

Do not claim that verification is complete unless the checksum or signature is actually validated against official release data.

## Important design decision

Either:

- Remove automatic `yt-dlp -U` updates and manage updates entirely inside the verified updater, or
- Capture the result of `yt-dlp -U`, then independently verify the resulting binary before allowing it to remain active.

The safer recommendation is to use one application-controlled, verified update path.

---

# Priority 2: Add runtime validation for all IPC input

## Current issue

The main process currently accepts renderer input using TypeScript types but does not appear to validate all values at runtime.

Examples include:

```ts
ipcMain.handle("inspect-url", async (_event, targetUrl: string) => {
  ...
});
```

```ts
ipcMain.handle("start-download", async (_event, options: DownloadOptions) => {
  ...
});
```

```ts
ipcMain.handle("save-settings", async (_event, newSettings) => {
  return appStore.saveSettings(newSettings);
});
```

TypeScript types do not protect the main process from malformed runtime messages.

## Required implementation

Add runtime validation for:

- `inspect-url`
- `start-download`
- `cancel-download`
- `save-settings`
- `delete-history-item`
- `open-path`
- `show-in-folder`

Validate:

- Object types.
- Required fields.
- Optional fields.
- String lengths.
- Boolean values.
- Numeric ranges.
- Enum values.
- IDs.
- File paths.
- URLs.
- Metadata.
- Cookie sources.
- Download paths.

Use a shared validation module, preferably:

```text
electron/security.ts
```

A schema library such as Zod may be used if appropriate.

## Requirements

- Reject malformed input before invoking filesystem or process operations.
- Do not pass unknown or unvalidated values to yt-dlp.
- Do not trust renderer-provided paths.
- Do not trust renderer-provided IDs.
- Do not expose stack traces to the renderer.
- Return safe, user-friendly error messages.

---

# Priority 3: Validate media URLs

## Current issue

User-controlled URLs are passed directly to yt-dlp.

The application should not pass arbitrary schemes or malformed values to an external executable.

## Required implementation

Create a helper such as:

```ts
validateMediaUrl(value: unknown): URL
```

Rules:

- Accept only `http:` and `https:`.
- Reject empty values.
- Reject malformed URLs.
- Reject URLs containing embedded credentials.
- Reject:
  - `file:`
  - `javascript:`
  - `data:`
  - `blob:`
  - `ftp:`
  - Unknown schemes
- Enforce a maximum URL length.
- Decide and document how loopback, localhost, private IP, link-local, and unspecified IP addresses are handled.

Apply validation to:

- URL inspection.
- Download requests.
- Re-download from history.
- Playlist entries.
- Any future external navigation.

Do not use a small platform allowlist unless required. AnyDownloader intentionally supports many platforms.

---

# Priority 4: Restrict filesystem access

## Current issue

The `open-path` and `show-in-folder` IPC handlers accept paths from the renderer. The current implementation does not appear to sufficiently verify that those paths are inside an approved directory.

This could allow a compromised renderer to request opening arbitrary local files or folders.

## Required implementation

Create safe path helpers using:

- `path.resolve()`
- `path.relative()`
- `fs.realpathSync()` where appropriate
- File-type checks
- Symlink/junction checks

Do not use naive checks such as:

```ts
filePath.startsWith(downloadPath)
```

## `open-path` requirements

Only allow:

- Existing regular files.
- Files inside the configured download directory.
- Files recorded in application history, if that behavior is required.

Reject:

- System files.
- Executables.
- Scripts.
- Directories.
- Files outside approved locations.
- Traversal paths.
- Symlink or junction escapes.

## `show-in-folder` requirements

Only allow:

- A file inside an approved directory.
- A parent directory inside an approved directory when the file no longer exists.

Do not open arbitrary parent directories supplied by the renderer.

---

# Priority 5: Harden temporary-file cleanup

## Current issue

The cleanup logic scans files based on names such as:

```ts
file.endsWith(".part")
file.endsWith(".ytdl
