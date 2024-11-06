import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  Subject, map, switchMap,
} from 'rxjs';
import {
  filter, shareReplay, startWith, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { storageCardElements } from 'app/pages/system/advanced/storage/storage-card/storage-card.elements';
import {
  StorageSettingsFormComponent,
} from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';

@UntilDestroy()
@Component({
  selector: 'ix-storage-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './storage-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    MatList,
    MatListItem,
    WithLoadingStateDirective,
    TranslateModule,
  ],
})
export class StorageCardComponent {
  private readonly reloadConfig$ = new Subject<void>();
  private storageSettings: { systemDsPool: string };
  protected readonly searchableElements = storageCardElements;
  protected readonly requiredRoles = [Role.FullAdmin];

  readonly storageSettings$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.ws.call('systemdataset.config').pipe(map((config) => config.pool))),
    map((systemDsPool) => ({ systemDsPool })),
    tap((config) => this.storageSettings = config),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  constructor(
    private chainedSlideIns: ChainedSlideInService,
    private advancedSettings: AdvancedSettingsService,
    private store$: Store<AppState>,
    private ws: WebSocketService,
  ) {}

  onConfigurePressed(): void {
    this.advancedSettings.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.open(StorageSettingsFormComponent, false, this.storageSettings)),
      filter((response) => !!response.response),
      tap(() => this.reloadConfig$.next()),
      untilDestroyed(this),
    ).subscribe();
  }
}
