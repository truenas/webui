import {
  ChangeDetectionStrategy, Component, Inject, OnInit, signal,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef, MatRow, MatRowDef, MatTable,
} from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Option } from 'app/interfaces/option.interface';
import { VirtualizationPciDeviceOption } from 'app/interfaces/virtualization.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

type PciPassthroughDevice = VirtualizationPciDeviceOption & {
  address: string;
};

const unknownType = 'UNKNOWN' as const;

@UntilDestroy()
@Component({
  selector: 'ix-pci-passthrough-dialog',
  templateUrl: './pci-passthrough-dialog.component.html',
  styleUrls: ['./pci-passthrough-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    MatDialogTitle,
    MatIconButton,
    TranslateModule,
    TestDirective,
    EmptyComponent,
    FormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    MatButton,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatDialogContent,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatTable,
    ReactiveFormsModule,
    MatHeaderCellDef,
  ],
})
export class PciPassthroughDialogComponent implements OnInit {
  protected readonly columns = ['type', 'device', 'actions'];

  protected filterForm = this.formBuilder.group({
    searchQuery: [''],
    type: [''],
  });

  protected devices = signal<PciPassthroughDevice[]>([]);
  protected filteredDevices = signal<PciPassthroughDevice[]>([]);
  protected typeOptions$: Observable<Option[]>;

  protected emptyConfig = signal({
    type: EmptyType.Loading,
    large: true,
  } as EmptyConfig);

  constructor(
    private api: ApiService,
    private formBuilder: FormBuilder,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    protected dialogRef: MatDialogRef<PciPassthroughDialogComponent, Option[]>,
    @Inject(MAT_DIALOG_DATA) protected options: { existingDeviceAddresses: string[] },
  ) {
    this.filterForm.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.filterTable());
  }

  ngOnInit(): void {
    this.loadDevices();
  }

  private loadDevices(): void {
    this.api.call('virt.device.pci_choices').pipe(
      map((choices) => {
        const devices: PciPassthroughDevice[] = [];
        const types = new Set<string>();

        Object.entries(choices).forEach(([address, device]) => {
          if (device.error) {
            // TODO: Workaround for a MW issue.
            return;
          }

          types.add(device.controller_type);

          if (this.options.existingDeviceAddresses.includes(address)) {
            return;
          }

          devices.push({
            ...device,
            address,
          });
        });

        this.devices.set(devices);
        this.typeOptions$ = of(Array.from(types).map((type) => ({
          label: type || (this.translate.instant('Unknown')),
          value: type || unknownType,
        })));
        this.filterTable();
      }),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe();
  }

  protected selectDevice(device: PciPassthroughDevice): void {
    // TODO: Consider adding support for selecting multiple devices at the same time.
    this.dialogRef.close([
      {
        label: device.description,
        value: device.address,
      },
    ]);
  }

  protected filterTable(): void {
    const filteredDevices = this.devices().filter((device) => {
      const searchQuery = this.filterForm.get('searchQuery')?.value.toLowerCase();
      const type = this.filterForm.get('type')?.value;

      if (searchQuery && !device.description.toLowerCase().includes(searchQuery)) {
        return false;
      }

      if (type) {
        if (type === unknownType) {
          return device.controller_type === null;
        }

        return device.controller_type === type;
      }

      return true;
    });

    this.filteredDevices.set(filteredDevices);

    if (!filteredDevices.length) {
      this.emptyConfig.set({
        type: EmptyType.NoSearchResults,
        large: true,
        title: this.translate.instant('No devices found'),
      });
    }
  }
}
