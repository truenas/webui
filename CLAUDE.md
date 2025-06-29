# CLAUDE.md - Guidelines for TrueNAS WebUI Project

## Build and Test Commands
- Run `yarn ui reset` once to create the environment file. This must be done before running tests or building the UI.
- Build: `yarn build` or `yarn build:prod` for production
- Start dev server: `yarn start`
- Never run all tests with `yarn test`. Instead test changed files: `yarn test:changed` or test individual files.
- Run specific test: `yarn test src/app/path/to/file.spec.ts`
- Lint code: `yarn lint` or `yarn lint:fix` to auto-fix issues. Wait for longer when linting.
- Run `yarn ui remote -i <some_ip>` to prepare UI for being served. Re-run this command after running `yarn build`.
- Ignore strict null check, i.e. don't run: `yarn strict-null-checks`

## Code Style Guidelines
- **Angular Component Naming**: Use kebab-case with prefix `ix-` (e.g., `ix-my-component`)
- **Own components**: Use ix-icon instead of mat-icon, use ix-form related components like ix-input instead of standard Angular Material components.
- **Templates**: Use Angular embedded control syntax (e.g. @if, @for) instead of ngIf, ngFor.
- **File Naming**: Kebab-case with specific suffixes (.component.ts, .service.ts, etc.)
- **Scope**: Use `private` on methods and fields only used in the component. Use `protected` for methods and fields used in component and template.
- **Functions/Variables**: Use camelCase, Observable variables end with `$`
- **Types/Interfaces**: Use PascalCase, enforce explicit types
- **Import Order**: External modules first, then internal modules, no relative imports (use 'app' alias)
- **Line Length**: Maximum 120 characters
- **Prefer**: Signals over @Output, standalone components, OnPush change detection
- **Error Handling**: Throw Error objects only, use explicit error types.

## Testing Guidelines
- Cover main happy paths.
- Write tests using Jest and Spectator. 
- You MUST use harnesses over spectator when possible, including native Angular harnesses and our custom harnesses like IxFormHarness or IxIconHarness. 
- Never rely on ixTest attributes for locating elements.
- When mocking data, always provide minimally sufficient number of properties in the object and use `as Interface` casting. Do NOT provide full objects.
- When mocking services, `mockProvider(MyService)` without mocking specific methods is usually enough.

## Branch and Commit Guidelines
- Branch naming: `NAS-<issue number>` (e.g., `NAS-12345`)
- Commit messages: `NAS-<issue number>: <description>`. 
- Keep commit message short (to one line).

## Playwright MCP for Browser Testing

**Setup**: Playwright MCP is configured in `.claude/settings.json` with `@playwright/mcp` dependency.

**Quick Start**:
1. Generate authenticated URL: `yarn auth-url /target-path`
2. Navigate: `mcp__playwright__browser_navigate` with the URL
3. Wait for page: `mcp__playwright__browser_wait_for` (5+ seconds)
4. Take snapshot: `mcp__playwright__browser_snapshot`

**Authentication Flow**:
```bash
# Generate authenticated URL (bypasses 15+ second login)
yarn auth-url /credentials/kmip
# Output: http://localhost:4200/credentials/kmip?token=...

# Use the URL with Playwright MCP
mcp__playwright__browser_navigate(url)
mcp__playwright__browser_wait_for(time: 5)  # Wait for redirect + load
mcp__playwright__browser_snapshot()         # See the page
```

**Important Notes**:
- **Login redirect is normal**: Page redirects to login page first, then auto-authenticates with token.
- **Wait for `ix-admin-layout`**: Don't take snapshots until the main admin layout (ix-admin-layout) appears.
- **Token TTL**: 2 hours, uses `root/testing` credentials from environment.ts
- **Browser sessions**: If browser gets stuck, restart Claude Code session

**Available Tools**:
- `browser_navigate` - Navigate to URL
- `browser_snapshot` - View page content (preferred)
- `browser_take_screenshot` - Capture images
- `browser_click/type/hover` - Interact with elements
- `browser_wait_for` - Wait for text/time
- `browser_tab_*` - Manage tabs