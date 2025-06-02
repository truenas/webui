# CLAUDE.md - Guidelines for TrueNAS WebUI Project

## Build and Test Commands
- Build: `yarn build` or `yarn build:prod` for production
- Start dev server: `yarn start`
- Run all tests: `yarn test`
- Run tests for changed files: `yarn test:changed`
- Run specific test: `yarn test src/app/path/to/file.spec.ts`
- Lint code: `yarn lint` or `yarn lint:fix` to auto-fix issues
- Run `yarn ui remote -i <some_ip>` to prepare UI for being served. Re-run this command after running `yarn build`.
- Ignore strict null check, i.e. don't run: `yarn strict-null-checks`

## Code Style Guidelines
- **Angular Component Naming**: Use kebab-case with prefix `ix-` (e.g., `ix-my-component`)
- **Own components**: Use ix-icon instead of mat-icon, use ix-form related components like ix-input instead of standard Angular Material components.
- **Templates**: Use Angular embedded control syntax (e.g. @if, @for) instead of ngIf, ngFor.
- **File Naming**: Kebab-case with specific suffixes (.component.ts, .service.ts, etc.)
- **Functions/Variables**: Use camelCase, Observable variables end with `$`
- **Types/Interfaces**: Use PascalCase, enforce explicit types
- **Import Order**: External modules first, then internal modules, no relative imports (use 'app' alias)
- **Line Length**: Maximum 120 characters
- **Prefer**: Signals over @Output, standalone components, OnPush change detection
- **Error Handling**: Throw Error objects only, use explicit error types
- **Testing**: Cover all happy paths, write Jest tests, prefer to use spectator and Angular harnesses. When mocking, provide minimally sufficient number of properties in the object.

## Branch and Commit Guidelines
- Branch naming: `NAS-<issue number>` (e.g., `NAS-12345`)
- Commit messages: `NAS-<issue number>: <description>`