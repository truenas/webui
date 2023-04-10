import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { CertificateAuthorityUpdate } from 'app/interfaces/certificate-authority.interface';
import { SummarySection } from 'app/modules/common/summary/summary.interface';
import { ReplicationWhatAndWhereComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-what-and-where/replication-what-and-where.component';
import { ReplicationWhenComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-when/replication-when.component';

@UntilDestroy()
@Component({
  templateUrl: './replication-wizard.component.html',
  styleUrls: ['./replication-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplicationWizardComponent {
  @ViewChild(ReplicationWhatAndWhereComponent) whatAndWhere: ReplicationWhatAndWhereComponent;
  @ViewChild(ReplicationWhenComponent) when: ReplicationWhenComponent;

  rowId: number;
  isLoading = false;
  summary: SummarySection[];

  constructor(
    private cdr: ChangeDetectorRef,
  ) {}

  setRowId(id: number): void {
    this.rowId = id;
  }

  getSteps(): [
    ReplicationWhatAndWhereComponent,
    ReplicationWhenComponent,
  ] {
    return [this.whatAndWhere, this.when];
  }

  updateSummary(): void {
    const stepsWithSummary = this.getSteps();
    this.summary = stepsWithSummary.map((step) => step.getSummary());
  }

  onSubmit(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const payload = this.preparePayload();
    console.warn(payload);
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  private preparePayload(): CertificateAuthorityUpdate {
    const steps = this.getSteps();

    const values = steps.map((step) => step.getPayload());
    return _.merge({}, ...values);
  }
}
