import { App } from 'app/interfaces/app.interface';

/**
 * Checks if an app is an external Docker container (not managed by TrueNAS Apps).
 * External apps are deployed outside TrueNAS (e.g., via Docker CLI, Portainer, Dockage).
 */
export function isExternalApp(app: App | null | undefined): boolean {
  return app?.source === 'EXTERNAL';
}

/**
 * Checks if an app is a TrueNAS-managed application.
 * Returns true if the app is not an external container.
 */
export function isTruenasApp(app: App | null | undefined): boolean {
  return !isExternalApp(app);
}
