# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.
# Goal: Minecraft Datapack Node Editor. An extension for VS Code that allows you to edit Minecraft datapacks using a node editor.
This projects is intended for a large public use, so we need to be careful with the code and the performance, me and you claude are expert/senior software engineers with mature approaches. Prioritise a good implementation over a quick and dirty one that fixes the issue in the immediate term. concise in our conversations I am a senior dev.

Rules:
- No code redundancy.
- No "any" type. For type "unknown", it is preferable to request authorization.
- Avoid globalthis.
- Prefer modern and standards logic 2024 abb 2025.
- Methods must be less than 10 lines of code and must do one thing correctly.
- No Legacy or Deprecated support.
- At the end of each sessions, check with `npm run lint`
- Avoid unnecessary re-renders with zustand or React.
- useEffect and useLayoutEffect is completely prohibited; you must ask for permission to use it. https://react.dev/learn/you-might-not-need-an-effect
- useMemo, useCallback are deprecated and are automacly done by React 19.
- useForwardRef is deprecated, use ref as props.
- no .foreach prefer for of or any loop or new set/map ECMAScript 2025 syntax.

It's not mandatory but you can use modern syntax ES2024 like Map.groupby or other thing.
Map -> groupBy()
Object -> map().filter().find().findLast().sort().toSorted().toReversed().fromEntries().groupBy()
Array -> findLast().toSorted().toReversed().with().toSpliced().fromAsync()
Set -> intersection().union().difference().symmetricDifference().isSubsetOf().isSupersetOf().isDisjointFrom()
Nullish Coalescing -> ??
Logical Assignment -> ||=
Float16Array

### Architecture

```
voxelio-vsc/
├── src/                          # Extension VS Code (tsdown)
│   ├── extension.ts              # Activation, commands, providers
│   ├── providers/
│   │   └── NodeEditorProvider.ts # WebviewViewProvider
│   └── services/
│       ├── CacheService.ts       # globalStorageUri for McDoc/registries
│       ├── VersionDetector.ts    # Parse pack.mcmeta → pack_format
│       └── RegistryLoader.ts     # Fetch + cache registries
├── webview/                      # React app (vite)
│   ├── src/
│   │   ├── nodes/                # Custom node components (StringNode, StructNode...)
│   │   ├── stores/               # Zustand stores
│   │   ├── helpers/
│   │   │   └── McdocHelpers.ts   # Port from Misode: simplifyType(), getDefault()
│   │   └── main.tsx
│   └── vite.config.ts
└── dist/
    ├── extension.js              # tsdown output
    └── webview/                  # vite output
```

# Dependencies
**Extension (src/):**
- `@types/vscode` - VS Code API types
- `tsdown` - Build (uses rolldown/Rust)
- `tsgo` - TypeScript 7 native (experimental)
- `biome` - Lint/format

**Webview (webview/):**
- `react`, `react-dom` ^19.2.3
- `zustand` ^5.0.9
- `tailwind-merge` ^3.4.0
- `@spyglassmc/core` ^0.4.42
- `@spyglassmc/mcdoc` ^0.3.43
- `@spyglassmc/json` ^0.3.46
- `@spyglassmc/java-edition` ^0.3.54
- `vite` 8.x + `@vitejs/plugin-react` + `babel-plugin-react-compiler`
- `tailwindcss` ^4.x


## Development Commands
- **Dev server**: `npm run dev` - Start Vite development server
- **Build**: `pnpm build`        - tsdown → dist/extension.js
- **Build Webview**: `pnpm build:webview` - vite → dist/webview/
- **Lint/Typecheck**: `npm run lint` - Run TypeScript compiler without emit for
  type checking
- **Format**: `npm run biome:format` - Format code with Biome
- **Lint check**: `npm run biome:check` - Check code with Biome linter
- **Auto-fix**: `npm run biome:unsafefix` - Auto-fix with Biome (unsafe)

### Spyglass Integration
Spyglass = LSP engine for McDoc validation. Key concepts:

```typescript
// 1. Create service per version
const service = await SpyglassService.create(versionId, client);

// 2. Get checker context for validation
const ctx = service.getCheckerContext(doc, errors);

// 3. Open/validate file
const docAndNode = await service.openFile(uri);

// 4. Apply functional edits
await service.applyEdit(uri, (node) => { /* mutate AST */ });
```

### Misode Files to Port

| File | Purpose | Action |
|------|---------|--------|
| `McdocHelpers.ts` | `simplifyType()`, `getDefault()`, `getChange()` | Port directly |
| `McdocRenderer.tsx` | Head/Body recursive rendering | Rewrite with custom design |
| `DataFetcher.ts` | Registry/symbols fetching | Adapt for VS Code cache |
| `Spyglass.ts` | LSP service wrapper | Adapt for extension context |

### Node Rendering Pattern (from Misode)

```
McdocRoot
├─ Head → Input controls (StringHead, EnumHead, NumericHead...)
└─ Body → Recursive children (StructBody, ListBody, UnionBody...)
```

Each node type has:
- `SimplifiedMcdocType.kind` → determines component
- `Head` → renders current value input
- `Body` → renders nested children

### VS Code Caching Strategy

```typescript
class CacheService {
  constructor(private context: vscode.ExtensionContext) {}

  // Persistent cache path
  get cachePath() { return this.context.globalStorageUri.fsPath; }

  // Cache McDoc symbols per version (~2-5MB each)
  async getMcdocSymbols(version: string): Promise<McdocSymbols>;

  // Cache registries per version (~500KB-1MB each)
  async getRegistries(version: string): Promise<Map<string, string[]>>;

  // Workspace-specific data
  async getWorkspaceRegistries(): Promise<CustomRegistries>;
}
```

Storage options:
- `context.globalStorageUri` → Heavy files (McDoc, registries)
- `context.workspaceState` → Per-workspace data
- `context.globalState` → Small persistent settings

### Version Detection
```typescript
class VersionDetector {
  async detect(): Promise<{ packFormat: number; version: string } | null> {
    const files = await vscode.workspace.findFiles('**/pack.mcmeta', null, 1);
    if (files.length === 0) return null;
    const content = JSON.parse(await vscode.workspace.fs.readFile(files[0]));
    return { packFormat: content.pack?.pack_format };
  }
}
```

### Extension ↔ Webview Communication
```typescript
// Extension → Webview
webview.postMessage({ type: 'schema', data: mcdocType });
webview.postMessage({ type: 'registries', data: registries });

// Webview → Extension
vscode.postMessage({ type: 'edit', path: ['conditions', 0], value: {...} });
vscode.postMessage({ type: 'save' });
```

### Registry Sources
1. **Vanilla registries**: `misode/mcmeta` GitHub (cached)  `https://raw.githubusercontent.com/misode/mcmeta/summary/registries/data.min.json`
2. **McDoc symbols**: `@spyglassmc/java-edition` or fetched
3. **Pack registries**: Parsed from workspace datapack files

### Key Implementation Notes
1. **No esbuild** - Use tsdown (rolldown/Rust)
2. **TypeScript 7** - Use `@typescript/native-preview` (tsgo)
3. **React 19** - No useMemo/useCallback (auto-optimized), no useForwardRef
4. **Tailwind v4** - Use `@tailwindcss/vite` plugin
5. **Webview isolation** - Full control over design, separate build