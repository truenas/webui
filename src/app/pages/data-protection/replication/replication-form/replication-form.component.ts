import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { merge } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Direction } from 'app/enums/direction.enum';
import { SnapshotNamingOption } from 'app/enums/snapshot-naming-option.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { CountManualSnapshotsParams } from 'app/interfaces/count-manual-snapshots.interface';
import { ReplicationCreate, ReplicationTask } from 'app/interfaces/replication-task.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  GeneralSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/general-section/general-section.component';
import {
  ScheduleSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/schedule-section/schedule-section.component';
import {
  SourceSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/source-section/source-section.component';
import {
  TargetSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/target-section/target-section.component';
import {
  TransportSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/transport-section/transport-section.component';
import {
  ReplicationWizardComponent,
} from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { DatasetService } from 'app/services/dataset-service/dataset.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ReplicationService } from 'app/services/replication.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './replication-form.component.html',
  styleUrls: ['./replication-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ReplicationService],
})
export class ReplicationFormComponent implements OnInit {
  @ViewChild(GeneralSectionComponent, { static: true }) generalSection: GeneralSectionComponent;
  @ViewChild(TransportSectionComponent, { static: true }) transportSection: TransportSectionComponent;
  @ViewChild(SourceSectionComponent, { static: true }) sourceSection: SourceSectionComponent;
  @ViewChild(TargetSectionComponent, { static: true }) targetSection: TargetSectionComponent;
  @ViewChild(ScheduleSectionComponent, { static: true }) scheduleSection: ScheduleSectionComponent;

  isLoading = false;

  sourceNodeProvider: TreeNodeProvider;
  targetNodeProvider: TreeNodeProvider;

  eligibleSnapshotsMessage = '';
  isEligibleSnapshotsMessageRed = false;

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    public formatter: IxFormatterService,
    private cdr: ChangeDetectorRef,
    private dialog: DialogService,
    private snackbar: SnackbarService,
    private datasetService: DatasetService,
    private replicationService: ReplicationService,
    private slideInService: IxSlideInService,
    private slideInRef: IxSlideInRef<ReplicationFormComponent>,
    @Inject(SLIDE_IN_DATA) public existingReplication: ReplicationTask,
  ) {}

  ngOnInit(): void {
    this.countSnapshotsOnChanges();
    this.updateExplorersOnChanges();
    this.updateExplorers();

    if (this.existingReplication) {
      this.setForEdit();
    }
  }

  get isNew(): boolean {
    return !this.existingReplication;
  }

  get sections(): [
    GeneralSectionComponent,
    TransportSectionComponent,
    SourceSectionComponent,
    TargetSectionComponent,
    ScheduleSectionComponent,
  ] {
    return [
      this.generalSection,
      this.transportSection,
      this.sourceSection,
      this.targetSection,
      this.scheduleSection,
    ];
  }

  get isLocal(): boolean {
    return this.generalSection.form.controls.transport.value === TransportMode.Local;
  }

  get isPush(): boolean {
    return this.generalSection.form.controls.direction.value === Direction.Push;
  }

  get usesNameRegex(): boolean {
    return this.sourceSection.form.controls.schema_or_regex.value === SnapshotNamingOption.NameRegex;
  }

  get isFormValid(): boolean {
    return this.sections.every((section) => section.form.valid);
  }

  setForEdit(): void {
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    const payload = this.getPayload();

    const operation$ = this.isNew
      ? this.ws.call('replication.create', [payload])
      : this.ws.call('replication.update', [this.existingReplication.id, payload]);

    this.isLoading = true;
    operation$
      .pipe(untilDestroyed(this))
      .subscribe(
        {
          next: () => {
            this.snackbar.success(
              this.isNew
                ? this.translate.instant('Replication task created.')
                : this.translate.instant('Replication task saved.'),
            );
            this.isLoading = false;
            this.cdr.markForCheck();
            this.slideInRef.close(true);
          },
          error: (error) => {
            this.isLoading = false;
            this.cdr.markForCheck();
            this.dialog.error(this.errorHandler.parseWsError(error));
          },
        },
      );
  }

  onSwitchToWizard(): void {
    this.slideInRef.close();
    this.slideInService.open(ReplicationWizardComponent, { wide: true });
  }

  private getPayload(): ReplicationCreate {
    return this.sections.reduce((acc, section) => {
      return { ...acc, ...section.getPayload() } as ReplicationCreate;
    }, {} as ReplicationCreate);
  }

  private countSnapshotsOnChanges(): void {
    merge(
      this.generalSection.form.controls.transport.valueChanges,
      this.generalSection.form.controls.direction.valueChanges,
      this.sourceSection.form.controls.name_regex.valueChanges,
      this.sourceSection.form.controls.also_include_naming_schema.valueChanges,
      this.targetSection.form.controls.target_dataset.valueChanges,
    )
      .pipe(
        // Workaround for https://github.com/angular/angular/issues/13129
        debounceTime(0),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.countEligibleManualSnapshots();
      });
  }

  private get canCountSnapshots(): boolean {
    const formValues = this.getPayload();
    return this.isPush
      && !this.isLocal
      && formValues.target_dataset
      && formValues.ssh_credentials
      && (Boolean(formValues.name_regex) || formValues.also_include_naming_schema?.length > 0);
  }

  private countEligibleManualSnapshots(): void {
    if (!this.canCountSnapshots) {
      this.eligibleSnapshotsMessage = '';
      return;
    }

    const formValues = this.getPayload();
    const payload: CountManualSnapshotsParams = {
      datasets: [formValues.target_dataset],
      transport: formValues.transport,
      ssh_credentials: formValues.ssh_credentials,
    };

    if (formValues.name_regex) {
      payload.name_regex = formValues.name_regex;
    } else {
      payload.naming_schema = formValues.also_include_naming_schema;
    }

    this.isLoading = true;
    this.cdr.markForCheck();
    this.ws.call('replication.count_eligible_manual_snapshots', [payload])
      .pipe(untilDestroyed(this))
      .subscribe(
        {
          next: (eligibleSnapshots) => {
            this.isEligibleSnapshotsMessageRed = eligibleSnapshots.eligible === 0;
            this.eligibleSnapshotsMessage = this.translate.instant(
              '{eligible} of {total} existing snapshots of dataset {targetDataset} would be replicated with this task.',
              {
                eligible: eligibleSnapshots.eligible,
                total: eligibleSnapshots.total,
                targetDataset: formValues.target_dataset,
              },
            );
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: (error: WebsocketError) => {
            this.isEligibleSnapshotsMessageRed = true;
            this.eligibleSnapshotsMessage = this.translate.instant('Error counting eligible snapshots.');
            if ('reason' in error) {
              this.eligibleSnapshotsMessage = `${this.eligibleSnapshotsMessage} ${error.reason}`;
            }

            this.isLoading = false;
            this.cdr.markForCheck();
          },
        },
      );
  }

  private updateExplorersOnChanges(): void {
    merge(
      this.generalSection.form.controls.direction.valueChanges,
      this.generalSection.form.controls.transport.valueChanges,
      this.transportSection.form.controls.ssh_credentials.valueChanges,
    )
      .pipe(
        // Workaround for https://github.com/angular/angular/issues/13129
        debounceTime(0),
        untilDestroyed(this),
      )
      .subscribe(() => this.updateExplorers());
  }

  private updateExplorers(): void {
    const formValues = this.getPayload();
    const localProvider = this.datasetService.getDatasetNodeProvider();
    let remoteProvider: TreeNodeProvider = null;
    if (formValues.ssh_credentials) {
      remoteProvider = this.replicationService.getTreeNodeProvider({
        transport: formValues.transport,
        sshCredential: formValues.ssh_credentials,
      });
    }

    this.sourceNodeProvider = this.isPush || this.isLocal ? localProvider : remoteProvider;
    this.targetNodeProvider = this.isPush && !this.isLocal ? remoteProvider : localProvider;
    this.cdr.markForCheck();
  }
}
