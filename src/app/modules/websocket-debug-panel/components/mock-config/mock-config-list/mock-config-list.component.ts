import {
  ChangeDetectionStrategy, Component, computed, inject,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MockConfigFormComponent } from 'app/modules/websocket-debug-panel/components/mock-config/mock-config-form/mock-config-form.component';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import {
  addMockConfig, deleteMockConfig, toggleMockConfig, exportMockConfigs,
} from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';
import { selectMockConfigs } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';

@Component({
  selector: 'ix-mock-config-list',
  standalone: true,
  imports: [
    MatButton,
    MatIconButton,
    MatSlideToggle,
    MatTooltip,
    TranslateModule,
    IxIconComponent,
    MockConfigFormComponent,
  ],
  templateUrl: './mock-config-list.component.html',
  styleUrls: ['./mock-config-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockConfigListComponent {
  private readonly store = inject(Store);

  protected readonly mockConfigs = this.store.selectSignal(selectMockConfigs);
  protected showForm = false;
  protected editingConfig: MockConfig | null = null;

  protected readonly hasEnabledMocks = computed(() => {
    return this.mockConfigs().some((config) => config.enabled);
  });

  protected toggleConfig(id: string): void {
    this.store.dispatch(toggleMockConfig({ id }));
  }

  protected deleteConfig(id: string): void {
    this.store.dispatch(deleteMockConfig({ id }));
  }

  protected editConfig(config: MockConfig): void {
    this.editingConfig = config;
    this.showForm = true;
  }

  protected addNewConfig(): void {
    this.editingConfig = null;
    this.showForm = true;
  }

  protected onFormSubmit(config: MockConfig): void {
    if (this.editingConfig) {
      // Form component handles the update
    } else {
      this.store.dispatch(addMockConfig({ config }));
    }
    this.showForm = false;
    this.editingConfig = null;
  }

  protected onFormCancel(): void {
    this.showForm = false;
    this.editingConfig = null;
  }

  protected exportConfigs(): void {
    this.store.dispatch(exportMockConfigs());
  }

  protected importConfigs(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const configs = JSON.parse(loadEvent.target?.result as string) as MockConfig[];
        configs.forEach((config) => {
          this.store.dispatch(addMockConfig({ config }));
        });
      } catch (error) {
        console.error('Failed to import configs:', error);
      }
    };
    reader.readAsText(file);
  }

  protected getConfigDescription(config: MockConfig): string {
    const type = config.type === 'call' ? 'Call' : 'Job';
    const pattern = config.messagePattern ? ` (${config.messagePattern})` : '';
    return `${type}: ${config.methodName}${pattern}`;
  }
}
