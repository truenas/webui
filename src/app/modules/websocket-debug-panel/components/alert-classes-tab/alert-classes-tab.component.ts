import {
  ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal, untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { format } from 'date-fns';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertCategory } from 'app/interfaces/alert.interface';
import { smartAlertRegistry } from 'app/modules/alerts/services/alert-enhancement.registry';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

interface AlertClassInfo {
  id: string;
  title: string;
  category: string;
}

@Component({
  selector: 'ix-alert-classes-tab',
  standalone: true,
  imports: [
    MatButton,
    MatCheckbox,
    TranslateModule,
  ],
  templateUrl: './alert-classes-tab.component.html',
  styleUrls: ['./alert-classes-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertClassesTabComponent {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  protected autoCheck = signal(true);
  protected isAuthenticated = toSignal(inject(WebSocketStatusService).isAuthenticated$, { initialValue: false });
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected missingFromEnum = signal<AlertClassInfo[]>([]);
  protected missingEnhancement = signal<AlertClassInfo[]>([]);
  protected staleInUi = signal<string[]>([]);
  protected lastCheckedFormatted = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.isAuthenticated() && this.autoCheck()) {
        untracked(() => this.runComparison());
      }
    });
  }

  protected onAutoCheckChange(checked: boolean): void {
    this.autoCheck.set(checked);
  }

  protected runComparison(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    this.api.call('alert.list_categories').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (categories: AlertCategory[]) => {
        this.compareClasses(categories);
        this.loading.set(false);
        this.lastCheckedFormatted.set(format(new Date(), 'yyyy-MM-dd HH:mm:ss'));
      },
      error: (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.error.set(`Failed to fetch alert categories: ${message}`);
        this.loading.set(false);
      },
    });
  }

  private compareClasses(categories: AlertCategory[]): void {
    const enumValues = new Set(Object.values(AlertClassName) as string[]);
    const registryKeys = new Set(Object.keys(smartAlertRegistry.byClass));

    const backendClasses = new Map<string, AlertClassInfo>();
    for (const category of categories) {
      for (const alertClass of category.classes) {
        const id = alertClass.id as string;
        backendClasses.set(id, {
          id,
          title: alertClass.title,
          category: category.title,
        });
      }
    }

    const missingEnum: AlertClassInfo[] = [];
    const missingEnh: AlertClassInfo[] = [];

    for (const [id, info] of backendClasses) {
      if (!enumValues.has(id)) {
        missingEnum.push(info);
      } else if (!registryKeys.has(id)) {
        missingEnh.push(info);
      }
    }

    this.missingFromEnum.set(
      missingEnum.toSorted((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id)),
    );
    this.missingEnhancement.set(
      missingEnh.toSorted((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id)),
    );

    const backendClassIds = new Set(backendClasses.keys());
    this.staleInUi.set(
      [...enumValues]
        .filter((id) => !backendClassIds.has(id))
        .toSorted((a, b) => a.localeCompare(b)),
    );
  }
}
