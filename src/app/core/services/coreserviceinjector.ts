import { Injector } from '@angular/core';

/**
 * Allows for retrieving singleton services using `CoreServiceInjector.get(MyService)` (whereas
 * `ReflectiveInjector.resolveAndCreate(MyService)` would create a new instance
 * of the service).
 */
export let CoreServiceInjector: Injector;

/**
 * Helper to set the exported {@link CoreServiceInjector}, needed as ES6 modules export
 * immutable bindings (see http://2ality.com/2015/07/es6-module-exports.html) for
 * which trying to make changes after using `import {CoreServiceInjector}` would throw:
 * "TS2539: Cannot assign to 'CoreServiceInjector' because it is not a variable".
 */
export function setCoreServiceInjector(injector: Injector) {
    if (CoreServiceInjector) {
        // Should not happen
        console.error('Programming error: CoreServiceInjector was already set');
    }
    else {
        CoreServiceInjector = injector;
    }
}
