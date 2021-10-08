import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { ActivatedRoute, Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as filesize from 'filesize';
import * as _ from 'lodash';
import { helptext_system_bootenv } from 'app/helptext/system/boot-env';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { WebSocketService, DialogService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'bootenv-attach-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class BootEnvAttachFormComponent implements FormConfiguration {
  route_success: string[] = ['system', 'boot', 'status'];
  isEntity = true;
  addCall = 'boot.attach' as const;
  pk: string;
  isNew = true;
  protected dialogRef: MatDialogRef<EntityJobComponent>;

  protected entityForm: EntityFormComponent;

  fieldConfig: FieldConfig[] = [
    {
      type: 'select',
      name: 'dev',
      placeholder: helptext_system_bootenv.dev_placeholder,
      tooltip: helptext_system_bootenv.dev_tooltip,
      options: [],
    },
    {
      type: 'checkbox',
      name: 'expand',
      placeholder: helptext_system_bootenv.expand_placeholder,
      tooltip: helptext_system_bootenv.expand_tooltip,
    },

  ];
  protected diskChoice: FormSelectConfig;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected dialog: MatDialog,
    protected dialogService: DialogService,
  ) {}

  preInit(entityForm: EntityFormComponent): void {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['pk'];
    });
    this.entityForm = entityForm;
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.diskChoice = _.find(this.fieldConfig, { name: 'dev' }) as FormSelectConfig;
    this.ws.call('disk.get_unused').pipe(untilDestroyed(this)).subscribe((res) => {
      res.forEach((item) => {
        const disk_name = item.name;
        const disksize = filesize(item['size'], { standard: 'iec' });
        item.name = `${item.name} (${disksize})`;
        this.diskChoice.options.push({ label: item.name, value: disk_name });
      });
    });
  }

  customSubmit(entityForm: { dev: string; expand: boolean }): void {
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T('Attach Device') }, disableClose: true });
    this.dialogRef.componentInstance.setDescription('Attaching Device...');
    this.dialogRef.componentInstance.setCall('boot.attach', [entityForm.dev, { expand: entityForm.expand }]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogRef.close(true);
      this.dialogService.info(helptext_system_bootenv.attach_dialog.title,
        `<i>${entityForm.dev}</i> ${helptext_system_bootenv.attach_dialog.message}`, '300px', 'info', true)
        .pipe(untilDestroyed(this)).subscribe(() => {
          this.router.navigate(
            new Array('').concat('system', 'boot'),
          );
        });
    });
    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
      this.dialogRef.componentInstance.setDescription(res.error);
    });
  }
}
