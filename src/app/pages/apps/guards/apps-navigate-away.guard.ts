import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';

@UntilDestroy()
@Injectable()
export class AppsNavigateAwayGuard {
  constructor(private appsFilterStore: AppsFilterStore) {}

  canDeactivate(): boolean {
    this.appsFilterStore.resetFilters();
    return true;
  }
}
