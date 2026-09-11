# Adler iOS

Native SwiftUI app (iOS 26, Swift 6) — a presentation adapter to the existing
Node/TypeScript coaching server in `server/`. See `.context/ios-brief.md` for
the full product/architecture brief. This scaffold proves the project builds,
the Adler Warm fonts and brand colours render, and the test targets run; the
screens themselves are placeholders for feature agents to replace (see
`Adler/Features/*`).

## Prerequisites

- Xcode 26.6 (Swift 6.3 toolchain), command line tools selected.
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) 2.46, e.g. `brew install xcodegen`.
- A booted iOS 26 simulator. These scripts default to the iPhone 17 Pro
  simulator UDID `9D3C9873-0CF0-4D2F-ABA6-0E821CA3E044`; override with the
  `SIMULATOR_UDID` environment variable if you use a different device.

The Xcode project (`Adler.xcodeproj`) is generated from `project.yml` and is
not committed — always run `generate.sh` (or any script, which does this for
you) after pulling changes to `project.yml`.

## Commands

All scripts live in `ios/scripts/` and are safe to run from any directory.

```
ios/scripts/generate.sh          # xcodegen generate -> Adler.xcodeproj
ios/scripts/build.sh             # build for the simulator; prints the .app path
ios/scripts/run.sh               # build, boot the simulator if needed, install, launch
ios/scripts/run.sh --url adler://goals   # ...then open a deep link
ios/scripts/screenshot.sh <name> # save .context/shots/<name>.png
ios/scripts/test.sh              # run AdlerTests (unit)
ios/scripts/test.sh --ui         # run AdlerUITests (slower; run occasionally)
ios/scripts/logs.sh              # stream simulator logs for com.withadler.app
```

## Pointing the app at a server

Not yet wired up — `Adler/Core/Networking` is currently just a placeholder
file for the networking agent. For reference, the intended setup per the
brief (`.context/ios-brief.md` §2, §5):

- The server runs locally with `npm run dev -- --port 8080` (from the repo
  root), and the simulator can reach it at `http://localhost:8080` with no
  extra configuration.
- For a physical device on the same Wi-Fi, the brief specifies the backend
  should accept RFC1918 private IPv4 hosts (e.g. `http://10.0.0.24:8080`)
  when `PUBLIC_URL` is unset (`.context/ios-brief.md` §5); check
  `docs/ios-app.md` for the backend agent's write-up once that lands.
- `Info.plist` currently sets `NSAllowsArbitraryLoads: true` (in addition to
  `NSAllowsLocalNetworking`) so plain-HTTP dev/LAN servers load without
  per-host ATS exceptions while the backend contract is still moving.
  **Release builds must drop `NSAllowsArbitraryLoads`** — see the comment
  next to that key in `project.yml`.
- Auth is the existing `adler_session` HttpOnly cookie; `URLSession` handles
  cookie storage automatically, so no token handling is needed on the client.
- Settings will eventually expose a base-URL field (advanced) once the
  onboarding/settings feature agents build it.

## Fonts

The seven Adler Warm weights are bundled as TTFs in `Adler/Resources/Fonts`
and registered via `UIAppFonts` in the generated `Info.plist`. Use them
through `AdlerFont.font(_:size:relativeTo:)` (`Adler/DesignSystem/AdlerFont.swift`)
rather than referencing PostScript names directly. `AdlerFont.verifyRegistered()`
runs at launch in DEBUG and logs any weight that failed to register — check
the Xcode/`logs.sh` console if text falls back to the system font. Exact
PostScript names are recorded in `.context/notes/scaffold.md`.

## Troubleshooting

**Simulator not booted** — `run.sh` boots the configured UDID automatically.
To do it manually: `xcrun simctl boot 9D3C9873-0CF0-4D2F-ABA6-0E821CA3E044`,
then open the Simulator app. `xcrun simctl list devices` shows current state.

**Fonts render as the system font (not Adler Warm)** — check the DEBUG
console for `AdlerFont:` log lines from `verifyRegistered()`. Likely causes:
a TTF is missing from `Adler/Resources/Fonts`, or its filename is missing
from `UIAppFonts` in `project.yml`'s `info.properties`, or the PostScript
name in `AdlerWeight.postScriptName` no longer matches the file (re-derive
with a CoreText descriptor read — `.context/notes/scaffold.md` has the
command used originally). After editing `project.yml`, re-run `generate.sh`.

**Signing / "no team" errors** — simulator builds don't need a team:
`project.yml` sets `CODE_SIGNING_ALLOWED: NO` / `CODE_SIGN_IDENTITY: "-"` for
exactly that reason. To build for a physical device, copy
`Signing.example.xcconfig` to `Signing.xcconfig` (gitignored) and set
`DEVELOPMENT_TEAM`, then also flip `CODE_SIGNING_ALLOWED` back to `YES` for
that build.

**`xcodegen generate` fails** — confirm `xcodegen version` reports 2.46 and
that `Signing.xcconfig` exists (copy it from `Signing.example.xcconfig` if
you deleted it; an empty file is fine).
