import {
  DestroyRef, Injectable, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { App } from 'app/interfaces/app.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

@Injectable({ providedIn: 'root' })
export class ActionRequiredAppsService {
  private appsService = inject(ApplicationsService);
  private destroyRef = inject(DestroyRef);

  private readonly appsRequiringAction = signal(new Set<string>());

  readonly hasActionRequired = computed(() => this.appsRequiringAction().size > 0);

  private initialized = false;

  initialize(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    this.appsService.getAllApps().pipe(
      catchError(() => of([] as App[])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((apps) => {
      const next = new Set<string>();
      for (const app of apps) {
        if (app.action_required) {
          next.add(app.name);
        }
      }
      this.appsRequiringAction.set(next);
    });

    this.appsService.getInstalledAppsUpdates().pipe(
      catchError(() => of(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => {
      if (event) {
        this.handleEvent(event);
      }
    });
  }

  private handleEvent(event: ApiEvent<App>): void {
    if (event.msg === CollectionChangeType.Removed) {
      const name = event.id?.toString();
      if (!name) {
        return;
      }
      this.appsRequiringAction.update((set) => {
        if (!set.has(name)) {
          return set;
        }
        const next = new Set(set);
        next.delete(name);
        return next;
      });
      return;
    }

    const app = event.fields;
    if (!app?.name) {
      return;
    }

    this.appsRequiringAction.update((set) => {
      const has = set.has(app.name);
      if (app.action_required && !has) {
        const next = new Set(set);
        next.add(app.name);
        return next;
      }
      if (!app.action_required && has) {
        const next = new Set(set);
        next.delete(app.name);
        return next;
      }
      return set;
    });
  }
}
