import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
  TnSidePanelActionDirective, TnSidePanelComponent,
} from '@truenas/ui-components';
import { isEqual } from 'lodash-es';
import {
  Observable, Subject, distinctUntilChanged, map, of, shareReplay, startWith, switchMap, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { consoleCardElements } from 'app/pages/system/advanced/console/console-card/console-card.elements';
import { ConsoleFormComponent } from 'app/pages/system/advanced/console/console-form/console-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

export interface ConsoleConfig {
  consolemenu: boolean;
  serialconsole: boolean;
  serialport: string;
  serialspeed: string;
  motd: string;
}

@Component({
  selector: 'ix-console-card',
  styleUrls: ['./console-card.component.scss'],
  templateUrl: './console-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    WithLoadingStateDirective,
    ConsoleFormComponent,
    TranslateModule,
  ],
})
export class ConsoleCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private unsavedChanges = inject(UnsavedChangesService);
  private destroyRef = inject(DestroyRef);

  private readonly reloadConfig$ = new Subject<void>();
  protected readonly requiredRoles = [Role.SystemAdvancedWrite];
  protected readonly searchableElements = consoleCardElements;

  protected configOpen = signal(false);
  protected configForm = viewChild(ConsoleFormComponent);

  readonly advancedConfig$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.store$),
    waitForAdvancedConfig,
    distinctUntilChanged((previous, current) => {
      const prevConfig: ConsoleConfig = {
        consolemenu: previous.consolemenu,
        serialconsole: previous.serialconsole,
        serialport: previous.serialport,
        serialspeed: previous.serialspeed,
        motd: previous.motd,
      };
      const currentConfig: ConsoleConfig = {
        consolemenu: current.consolemenu,
        serialconsole: current.serialconsole,
        serialport: current.serialport,
        serialspeed: current.serialspeed,
        motd: current.motd,
      };
      return isEqual(prevConfig, currentConfig);
    }),
    map((config) => ({
      consolemenu: config.consolemenu,
      serialconsole: config.serialconsole,
      serialport: config.serialport,
      serialspeed: config.serialspeed,
      motd: config.motd,
    })),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  protected readonly closeGuard = (): Observable<boolean> => {
    return this.configForm()?.hasUnsavedChanges()
      ? this.unsavedChanges.showConfirmDialog()
      : of(true);
  };

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.configOpen.set(true));
  }

  protected onConfigClosed(saved: boolean): void {
    this.configOpen.set(false);
    if (saved) {
      this.reloadConfig$.next();
    }
  }
}
