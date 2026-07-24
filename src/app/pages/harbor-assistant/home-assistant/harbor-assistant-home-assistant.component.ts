import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import {
  EndpointResult,
  HarborAssistantStatusTone,
  HomeAssistantConfigPayload,
  HomeAssistantEntity,
  HomeAssistantInstallPlanResponse,
  HomeAssistantInstallStatusResponse,
  HomeAssistantServiceDomain,
  HomeAssistantStatusResponse,
} from 'app/pages/harbor-assistant/interfaces/harbor-assistant-status.interface';
import { HarborAssistantApiService } from 'app/pages/harbor-assistant/services/harbor-assistant-api.service';

interface HomeAssistantMetric {
  label: string;
  value: string;
  tone: HarborAssistantStatusTone;
}

const defaultExposedDomains = [
  'light',
  'switch',
  'sensor',
  'binary_sensor',
  'device_tracker',
  'climate',
  'cover',
  'fan',
  'lock',
  'camera',
  'scene',
  'script',
];

const harborLinkHomeAssistantEndpointMarker = 'harborlink://home-assistant';

@Component({
  selector: 'ix-harbor-assistant-home-assistant',
  templateUrl: './harbor-assistant-home-assistant.component.html',
  styleUrl: './harbor-assistant-home-assistant.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatCheckbox,
    MatDivider,
    MatFormField,
    MatInput,
    MatLabel,
    MatOption,
    MatSelect,
    NgClass,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class HarborAssistantHomeAssistantComponent implements OnInit {
  private readonly harborAssistantApi = inject(HarborAssistantApiService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(false);
  protected readonly actionInProgress = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly status = signal<HomeAssistantStatusResponse | null>(null);
  protected readonly installStatus = signal<HomeAssistantInstallStatusResponse | null>(null);
  protected readonly installPlan = signal<HomeAssistantInstallPlanResponse | null>(null);
  protected readonly entities = signal<HomeAssistantEntity[]>([]);
  protected readonly serviceDomains = signal<HomeAssistantServiceDomain[]>([]);

  protected readonly configForm = this.fb.group({
    enabled: [true],
    baseUrl: [''],
    accessToken: [''],
    clearAccessToken: [false],
    exposedDomains: [defaultExposedDomains.join('\n')],
    allowedEntities: [''],
    allowedCameras: [''],
    cameraEntityBindings: [''],
  });

  protected readonly entityFilterForm = this.fb.group({
    query: [''],
    domain: ['all'],
    readiness: ['all'],
  });

  protected readonly entityFilters = signal({ query: '', domain: 'all', readiness: 'all' });
  protected readonly readinessOptions = [
    { label: T('All readiness'), value: 'all' },
    { label: T('Safe control'), value: 'safe_control' },
    { label: T('Read only'), value: 'read_only' },
    { label: T('Unsupported'), value: 'unsupported' },
  ];

  protected readonly statusTone = computed<HarborAssistantStatusTone>(() => {
    const status = this.status();
    if (!status?.enabled) {
      return 'neutral';
    }
    if (status.status === 'connected' || status.status === 'synced') {
      return 'good';
    }
    if (status.configured) {
      return 'warn';
    }
    return 'neutral';
  });

  protected readonly installTone = computed<HarborAssistantStatusTone>(() => {
    switch (this.installStatus()?.status) {
      case 'running':
        return 'good';
      case 'blocked':
      case 'error':
        return 'danger';
      case 'not_installed':
        return 'neutral';
      default:
        return 'warn';
    }
  });

  protected readonly statusLabel = computed(() => {
    const status = this.status();
    if (!status) {
      return T('Unknown');
    }
    if (!status.enabled) {
      return T('Disabled');
    }
    if (status.status === 'synced') {
      return T('Synced');
    }
    if (status.status === 'connected') {
      return T('Connected');
    }
    if (status.configured) {
      return T('Configured');
    }
    return T('Not configured');
  });

  protected readonly managedByHarborLink = computed(() => {
    const status = this.status();
    return status ? this.isHarborLinkManagedStatus(status) : false;
  });

  protected readonly homeAssistantUrl = computed(() => {
    const statusUrl = this.managedByHarborLink() ? '' : this.status()?.base_url?.trim();
    const installUrl = this.installStatus()?.onboarding_url?.trim();
    return this.browserReachableUrl(statusUrl || installUrl || '');
  });

  protected readonly metrics = computed<HomeAssistantMetric[]>(() => {
    const status = this.status();
    const serviceDomainCount = this.serviceDomains().length;
    const serviceCount = status?.service_count
      ?? this.serviceDomains().reduce((count, domain) => count + domain.services.length, 0);
    return [
      {
        label: T('Entities'),
        value: String(status?.entity_count ?? this.entities().length),
        tone: (status?.entity_count ?? this.entities().length) > 0 ? 'good' : 'neutral',
      },
      {
        label: T('Service domains'),
        value: String(serviceDomainCount),
        tone: serviceDomainCount > 0 ? 'good' : 'neutral',
      },
      {
        label: T('Services'),
        value: String(serviceCount),
        tone: serviceCount > 0 ? 'good' : 'neutral',
      },
      {
        label: T('Version'),
        value: status?.version || T('Unknown'),
        tone: status?.version ? 'good' : 'neutral',
      },
      {
        label: T('Last sync'),
        value: this.formatTimestamp(status?.last_sync_at),
        tone: status?.last_sync_at ? 'good' : 'neutral',
      },
    ];
  });

  protected readonly domainOptions = computed(() => {
    const domains = new Set(this.entities().map((entity) => entity.domain).filter(Boolean));
    return Array.from(domains).sort((left, right) => left.localeCompare(right));
  });

  protected readonly visibleEntities = computed(() => {
    const filters = this.entityFilters();
    const query = filters.query.trim().toLowerCase();
    return this.entities()
      .filter((entity) => {
        const domainMatch = filters.domain === 'all' || entity.domain === filters.domain;
        const readinessMatch = filters.readiness === 'all' || entity.readiness === filters.readiness;
        const queryMatch = !query
          || entity.entity_id.toLowerCase().includes(query)
          || entity.display_name.toLowerCase().includes(query)
          || entity.state.toLowerCase().includes(query);
        return domainMatch && readinessMatch && queryMatch;
      })
      .slice(0, 48);
  });

  protected readonly syncScopeDomains = computed(() => this.status()?.exposed_domains ?? []);
  protected readonly visibleServiceDomains = computed(() => this.serviceDomains().slice(0, 12));

  ngOnInit(): void {
    this.entityFilterForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((filters) => {
        this.entityFilters.set({
          query: filters.query ?? '',
          domain: filters.domain ?? 'all',
          readiness: filters.readiness ?? 'all',
        });
      });
    this.refresh();
  }

  protected refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      status: this.result(this.harborAssistantApi.getHomeAssistantStatus()),
      installStatus: this.result(this.harborAssistantApi.getHomeAssistantInstallStatus()),
    }).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe(({ status, installStatus }) => {
      if (status.data) {
        this.status.set(status.data);
        this.patchConfigForm(status.data);
      }
      if (installStatus.data) {
        this.installStatus.set(installStatus.data);
      }
      this.error.set(status.error ?? installStatus.error);
      if (status.data?.configured) {
        this.refreshInventory();
      } else {
        this.entities.set([]);
        this.serviceDomains.set([]);
      }
    });
  }

  protected saveConfig(): void {
    const form = this.configForm.getRawValue();
    const baseUrl = form.baseUrl.trim();
    if (form.enabled && !this.managedByHarborLink() && !baseUrl) {
      this.error.set(T('Home Assistant URL is required for a new connection.'));
      return;
    }
    let cameraEntityBindings: Record<string, string>;
    try {
      cameraEntityBindings = this.parseCameraEntityBindings(form.cameraEntityBindings);
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : T('Invalid camera entity binding.'));
      return;
    }
    const accessToken = form.accessToken.trim();
    const payload: HomeAssistantConfigPayload = {
      enabled: form.enabled,
      access_token: accessToken || undefined,
      clear_access_token: !accessToken && form.clearAccessToken,
      exposed_domains: this.parseList(form.exposedDomains, true),
      allowed_entities: this.parseList(form.allowedEntities, true),
      allowed_cameras: this.parseList(form.allowedCameras, true),
      camera_entity_bindings: cameraEntityBindings,
    };
    if (baseUrl) {
      payload.base_url = baseUrl;
    }
    this.runAction(
      'home-assistant-config',
      this.harborAssistantApi.saveHomeAssistantConfig(payload),
      (response) => {
        this.status.set(response.status);
        this.configForm.markAsPristine();
        this.patchConfigForm(response.status);
        this.message.set(T('Home Assistant settings saved.'));
        if (response.status.configured) {
          this.refreshInventory();
        }
      },
    );
  }

  protected testConnection(): void {
    this.runAction(
      'home-assistant-test',
      this.harborAssistantApi.testHomeAssistantConnection(),
      (response) => {
        this.status.set(response.status);
        this.patchConfigForm(response.status);
        this.message.set(response.test.ok ? T('Home Assistant connection passed.') : T('Home Assistant connection failed.'));
        if (!response.test.ok && response.test.error) {
          this.error.set(response.test.error);
        }
      },
    );
  }

  protected syncEntities(): void {
    this.runAction(
      'home-assistant-sync',
      this.harborAssistantApi.syncHomeAssistant(),
      (response) => {
        this.status.set(response.status);
        this.entities.set(response.entities);
        this.serviceDomains.set(response.service_domains);
        this.patchConfigForm(response.status);
        this.message.set(T('Home Assistant entities synced.'));
      },
    );
  }

  protected loadInstallPlan(): void {
    this.runAction(
      'home-assistant-install-plan',
      this.harborAssistantApi.getHomeAssistantInstallPlan(),
      (response) => {
        this.installPlan.set(response);
        this.message.set(T('Home Assistant install plan is ready.'));
      },
    );
  }

  protected installManaged(): void {
    this.runAction(
      'home-assistant-install',
      this.harborAssistantApi.installHomeAssistant(false),
      (response) => {
        this.installPlan.set(response.plan);
        this.message.set(response.message || T('Home Assistant install requested.'));
        this.refresh();
      },
    );
  }

  protected actionBusy(action: string): boolean {
    return this.actionInProgress() === action;
  }

  protected isBusy(): boolean {
    return this.actionInProgress() !== null || this.loading();
  }

  protected toneClass(tone: HarborAssistantStatusTone): string {
    return `tone-${tone}`;
  }

  protected readinessLabel(entity: HomeAssistantEntity): string {
    switch (entity.readiness) {
      case 'safe_control':
        return T('Safe control');
      case 'read_only':
        return T('Read only');
      case 'unsupported':
        return T('Unsupported');
      default:
        return entity.readiness || T('Unknown');
    }
  }

  protected readinessTone(entity: HomeAssistantEntity): HarborAssistantStatusTone {
    switch (entity.readiness) {
      case 'safe_control':
        return 'good';
      case 'read_only':
        return 'neutral';
      case 'unsupported':
        return 'warn';
      default:
        return 'neutral';
    }
  }

  protected automationRoleLabel(entity: HomeAssistantEntity): string {
    switch (entity.automation_role) {
      case 'safe_control_candidate':
        return T('Low-risk action');
      case 'trigger_source':
        return T('Trigger source');
      case 'read_only_context':
        return T('Read-only context');
      case 'manual_review_only':
        return T('Manual review');
      case 'unsupported':
        return T('Not referable');
      default:
        return entity.automation_reference_allowed ? T('Referable') : T('Not referable');
    }
  }

  protected formatTimestamp(value?: string | null): string {
    if (!value) {
      return T('Never');
    }
    const trimmed = value.trim();
    const numericTimestamp = /^\d{10,13}$/.test(trimmed) ? Number(trimmed) : NaN;
    let date = new Date(trimmed);
    if (Number.isFinite(numericTimestamp)) {
      const timestampMs = trimmed.length === 10 ? numericTimestamp * 1000 : numericTimestamp;
      date = new Date(timestampMs);
    }
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
    return trimmed;
  }

  private refreshInventory(): void {
    forkJoin({
      entities: this.result(this.harborAssistantApi.getHomeAssistantEntities()),
      services: this.result(this.harborAssistantApi.getHomeAssistantServices()),
    }).subscribe(({ entities, services }) => {
      this.entities.set(entities.data?.entities ?? []);
      this.serviceDomains.set(services.data?.services ?? []);
      this.error.set(entities.error ?? services.error ?? this.error());
    });
  }

  private patchConfigForm(status: HomeAssistantStatusResponse): void {
    if (this.configForm.dirty) {
      return;
    }
    this.configForm.patchValue({
      enabled: status.enabled,
      baseUrl: this.isHarborLinkManagedStatus(status) ? '' : status.base_url,
      accessToken: '',
      clearAccessToken: false,
      exposedDomains: (status.exposed_domains?.length ? status.exposed_domains : defaultExposedDomains).join('\n'),
      allowedEntities: (status.allowed_entities ?? []).join('\n'),
      allowedCameras: (status.allowed_cameras ?? []).join('\n'),
      cameraEntityBindings: Object.entries(status.camera_entity_bindings ?? {})
        .map(([cameraId, entityId]) => `${cameraId}=${entityId}`)
        .join('\n'),
    });
  }

  private isHarborLinkManagedStatus(status: HomeAssistantStatusResponse): boolean {
    return status.managed_by_harborlink === true
      || status.base_url?.trim() === harborLinkHomeAssistantEndpointMarker;
  }

  private runAction<T>(
    action: string,
    request$: Observable<T>,
    onSuccess: (response: T) => void,
  ): void {
    this.actionInProgress.set(action);
    this.error.set(null);
    this.message.set(null);
    request$.pipe(
      finalize(() => this.actionInProgress.set(null)),
    ).subscribe({
      next: onSuccess,
      error: (error: unknown) => this.error.set(this.getErrorMessage(error)),
    });
  }

  private result<T>(request$: Observable<T>): Observable<EndpointResult<T>> {
    return request$.pipe(
      map((data): EndpointResult<T> => ({ data, error: null })),
      catchError((error: unknown) => of({ data: null, error: this.getErrorMessage(error) })),
    );
  }

  private parseList(value: string, lowercase = false): string[] {
    return value
      .split(/\r?\n|,/)
      .map((item) => (lowercase ? item.trim().toLowerCase() : item.trim()))
      .filter((item, index, values) => item.length > 0 && values.indexOf(item) === index);
  }

  private parseCameraEntityBindings(value: string): Record<string, string> {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((bindings, line) => {
        const separator = line.indexOf('=');
        const cameraId = separator > 0 ? line.slice(0, separator).trim() : '';
        const entityId = separator > 0 ? line.slice(separator + 1).trim().toLowerCase() : '';
        if (!cameraId || !entityId.startsWith('camera.')) {
          throw new Error(T('Camera bindings must use camera-id=camera.entity format.'));
        }
        bindings[cameraId] = entityId;
        return bindings;
      }, {});
  }

  private browserReachableUrl(value: string): string | null {
    if (!value) {
      return null;
    }
    try {
      const url = new URL(value);
      const browserHost = globalThis.location?.hostname;
      if (browserHost && (url.hostname === '127.0.0.1' || url.hostname === 'localhost')) {
        url.hostname = browserHost;
      }
      return url.toString();
    } catch {
      return value;
    }
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const payload = (error as { error?: unknown }).error;
      if (typeof payload === 'object' && payload !== null && 'error' in payload) {
        const nested = (payload as { error?: unknown }).error;
        if (typeof nested === 'string' && nested.trim()) {
          return nested;
        }
      }
      if (typeof payload === 'string' && payload.trim()) {
        return payload;
      }
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    return T('Unknown connection error.');
  }
}
