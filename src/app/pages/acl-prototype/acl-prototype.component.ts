import { ChangeDetectionStrategy, Component, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatChip } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionPanel, MatExpansionPanelHeader } from '@angular/material/expansion';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AclEntryEditModalComponent } from './acl-entry-edit-modal/acl-entry-edit-modal.component';
import { PresetSelectionModalComponent } from './preset-selection-modal/preset-selection-modal.component';

export interface AclEntry {
  id: string;
  type: 'USER_OBJ' | 'GROUP_OBJ' | 'USER' | 'GROUP' | 'MASK' | 'OTHER';
  name: string;
  permissions: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  isDefault?: boolean;
}

export interface AclPreset {
  name: string;
  description: string;
  entries: AclEntry[];
}

@Component({
  selector: 'ix-acl-prototype',
  templateUrl: './acl-prototype.component.html',
  styleUrls: ['./acl-prototype.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    MatIconButton,
    MatCard,
    MatCardContent,
    MatChip,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatTooltip,
    TranslateModule,
    IxCheckboxComponent,
    IxSelectComponent,
    IxIconComponent,
    ReactiveFormsModule,
  ],
})
export class AclPrototypeComponent {
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);

  constructor() {
    // Listen for ownership form changes to update reactive signals
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil -- using takeUntilDestroyed
    this.ownershipForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((formValue) => {
      if (formValue.owner) {
        this.currentOwner.set(formValue.owner);
      }
      if (formValue.group) {
        this.currentGroup.set(formValue.group);
      }
      // Trigger validation update when owner/group changes
      this.updateValidation();
    });
  }

  // Advanced options form
  readonly advancedOptionsForm = this.fb.group({
    validateAcl: [true],
    applyOwner: [false],
    applyGroup: [false],
  });

  // Owner/Group form
  readonly ownershipForm = this.fb.group({
    owner: ['alice'],
    group: ['staff'],
  });

  // Reactive signals for current owner/group
  readonly currentOwner = signal('alice');
  readonly currentGroup = signal('staff');

  // Mock user and group options
  readonly userOptions$ = of([
    { label: 'alice', value: 'alice' },
    { label: 'bob', value: 'bob' },
    { label: 'charlie', value: 'charlie' },
    { label: 'david', value: 'david' },
    { label: 'eve', value: 'eve' },
  ]);

  readonly groupOptions$ = of([
    { label: 'staff', value: 'staff' },
    { label: 'developers', value: 'developers' },
    { label: 'admin', value: 'admin' },
    { label: 'users', value: 'users' },
    { label: 'wheel', value: 'wheel' },
  ]);

  // Sample data for prototype
  readonly selectedPath = signal('/mnt/tank/shared');
  readonly owner = signal('alice');
  readonly ownerGroup = signal('staff');

  readonly accessEntries = signal<AclEntry[]>([
    {
      id: '1',
      type: 'USER_OBJ',
      name: 'alice',
      permissions: { read: true, write: true, execute: true },
    },
    {
      id: '2',
      type: 'GROUP_OBJ',
      name: 'staff',
      permissions: { read: true, write: true, execute: false },
    },
    {
      id: '3',
      type: 'USER',
      name: 'bob',
      permissions: { read: true, write: false, execute: false },
    },
    {
      id: '4',
      type: 'GROUP',
      name: 'developers',
      permissions: { read: true, write: true, execute: true },
    },
    {
      id: '5',
      type: 'MASK',
      name: '',
      permissions: { read: true, write: true, execute: true },
    },
    {
      id: '6',
      type: 'OTHER',
      name: '',
      permissions: { read: true, write: false, execute: false },
    },
  ]);

  readonly defaultEntries = signal<AclEntry[]>([
    {
      id: 'd1',
      type: 'USER_OBJ',
      name: 'alice',
      permissions: { read: true, write: true, execute: true },
      isDefault: true,
    },
    {
      id: 'd2',
      type: 'GROUP_OBJ',
      name: 'staff',
      permissions: { read: true, write: true, execute: true },
      isDefault: true,
    },
    {
      id: 'd3',
      type: 'OTHER',
      name: '',
      permissions: { read: false, write: false, execute: false },
      isDefault: true,
    },
  ]);

  readonly presets = signal<AclPreset[]>([
    {
      name: 'POSIX_OPEN',
      description: 'Open permissions - Full access for owner and group, read access for others',
      entries: [
        {
          id: 'p1',
          type: 'USER_OBJ',
          name: '',
          permissions: {
            read: true,
            write: true,
            execute: true,
          },
        },
        {
          id: 'p2',
          type: 'GROUP_OBJ',
          name: '',
          permissions: {
            read: true,
            write: true,
            execute: true,
          },
        },
        {
          id: 'p3',
          type: 'OTHER',
          name: '',
          permissions: {
            read: true,
            write: false,
            execute: true,
          },
        },
      ],
    },
    {
      name: 'POSIX_RESTRICTED',
      description: 'Restricted permissions - Full access for owner, limited access for group, no access for others',
      entries: [
        {
          id: 'p4',
          type: 'USER_OBJ',
          name: '',
          permissions: {
            read: true,
            write: true,
            execute: true,
          },
        },
        {
          id: 'p5',
          type: 'GROUP_OBJ',
          name: '',
          permissions: {
            read: true,
            write: false,
            execute: true,
          },
        },
        {
          id: 'p6',
          type: 'OTHER',
          name: '',
          permissions: {
            read: false,
            write: false,
            execute: false,
          },
        },
      ],
    },
    {
      name: 'POSIX_HOME',
      description: 'Home directory permissions - Full access for owner, group access, no access for others',
      entries: [
        {
          id: 'p7',
          type: 'USER_OBJ',
          name: '',
          permissions: {
            read: true,
            write: true,
            execute: true,
          },
        },
        {
          id: 'p8',
          type: 'GROUP_OBJ',
          name: '',
          permissions: {
            read: true,
            write: false,
            execute: true,
          },
        },
        {
          id: 'p9',
          type: 'OTHER',
          name: '',
          permissions: {
            read: false,
            write: false,
            execute: false,
          },
        },
      ],
    },
    {
      name: 'POSIX_ADMIN',
      description: 'Administrative permissions - Full access for owner and group, limited access for others',
      entries: [
        {
          id: 'p10',
          type: 'USER_OBJ',
          name: '',
          permissions: {
            read: true,
            write: true,
            execute: true,
          },
        },
        {
          id: 'p11',
          type: 'GROUP_OBJ',
          name: '',
          permissions: {
            read: true,
            write: true,
            execute: true,
          },
        },
        {
          id: 'p12',
          type: 'OTHER',
          name: '',
          permissions: {
            read: true,
            write: false,
            execute: false,
          },
        },
      ],
    },
  ]);

  readonly selectedPreset = signal<AclPreset | null>(null);
  readonly showAdvancedOptions = signal(false);

  getPermissionString(permissions: AclEntry['permissions']): string {
    return [
      permissions.read ? 'r' : '-',
      permissions.write ? 'w' : '-',
      permissions.execute ? 'x' : '-',
    ].join('');
  }

  getTypeDisplayName(type: AclEntry['type']): string {
    const typeNames: Record<AclEntry['type'], string> = {
      USER_OBJ: 'Owner',
      GROUP_OBJ: 'Owning Group',
      USER: 'User',
      GROUP: 'Group',
      MASK: 'Mask',
      OTHER: 'Other',
    };
    return typeNames[type];
  }

  getTypeIcon(type: AclEntry['type']): string {
    const typeIcons: Record<AclEntry['type'], string> = {
      USER_OBJ: 'account_circle',
      GROUP_OBJ: 'group',
      USER: 'person',
      GROUP: 'group',
      MASK: 'security',
      OTHER: 'group',
    };
    return typeIcons[type];
  }

  getEffectivePermissionsExplanation(): string {
    const maskEntry = this.accessEntries().find((entry) => entry.type === 'MASK');
    if (!maskEntry) {
      return 'No mask entry found. All named users and groups have their defined permissions.';
    }

    const maskPerms = this.getPermissionString(maskEntry.permissions);
    return `Mask is ${maskPerms}. Named users and groups are limited by the mask permissions.`;
  }

  applyPreset(preset: AclPreset): void {
    this.selectedPreset.set(preset);

    // Create new entries with unique IDs and ensure proper structure
    const newAccessEntries = preset.entries.map((entry, index) => ({
      ...entry,
      id: `preset-${Date.now()}-${index}`, // Ensure unique IDs
      isDefault: false, // These are ACCESS entries
    }));

    // Apply the preset to ACCESS entries
    this.accessEntries.set(newAccessEntries);

    // Also create corresponding DEFAULT entries for directories
    const newDefaultEntries = preset.entries.map((entry, index) => ({
      ...entry,
      id: `preset-default-${Date.now()}-${index}`,
      isDefault: true, // These are DEFAULT entries
    }));

    this.defaultEntries.set(newDefaultEntries);

    this.updateValidation();
  }

  copyAccessToDefault(): void {
    const accessEntries = this.accessEntries();
    const defaultEntries = accessEntries.map((entry) => ({
      ...entry,
      id: `d${entry.id}`,
      isDefault: true,
    }));
    this.defaultEntries.set(defaultEntries);
  }

  autoHandleMaskEntries(): void {
    const currentEntries = this.accessEntries();
    const hasNamedUsersOrGroups = currentEntries.some((entry) => entry.type === 'USER' || entry.type === 'GROUP');
    const hasMask = currentEntries.some((entry) => entry.type === 'MASK');

    if (hasNamedUsersOrGroups && !hasMask) {
      // Calculate optimal mask permissions based on existing entries
      const maxPermissions = currentEntries
        .filter((entry) => entry.type === 'USER' || entry.type === 'GROUP' || entry.type === 'GROUP_OBJ')
        .reduce((max, entry) => ({
          read: max.read || entry.permissions.read,
          write: max.write || entry.permissions.write,
          execute: max.execute || entry.permissions.execute,
        }), { read: false, write: false, execute: false });

      const newMask: AclEntry = {
        id: `mask-${Date.now()}`,
        type: 'MASK',
        name: '',
        permissions: maxPermissions,
      };
      this.accessEntries.set([...currentEntries, newMask]);
    } else if (!hasNamedUsersOrGroups && hasMask) {
      // Remove unnecessary mask entries
      const entriesWithoutMask = currentEntries.filter((entry) => entry.type !== 'MASK');
      this.accessEntries.set(entriesWithoutMask);
    }
  }

  toggleAdvancedOptions(): void {
    this.showAdvancedOptions.set(!this.showAdvancedOptions());
  }

  openPresetModal(): void {
    const dialogRef = this.dialog.open(PresetSelectionModalComponent, {
      data: {
        presets: this.presets(),
      },
      width: '600px',
      maxHeight: '90vh',
    });

    // eslint-disable-next-line rxjs-angular/prefer-takeuntil -- using takeUntilDestroyed
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((selectedPreset: AclPreset | null) => {
      if (selectedPreset) {
        this.applyPreset(selectedPreset);
      }
    });
  }


  removeEntry(entryId: string, isDefault = false): void {
    const entries = isDefault ? this.defaultEntries() : this.accessEntries();
    const filteredEntries = entries.filter((entry) => entry.id !== entryId);

    if (isDefault) {
      this.defaultEntries.set(filteredEntries);
    } else {
      this.accessEntries.set(filteredEntries);
      this.updateValidation();
    }
  }

  addNewEntry(type: AclEntry['type'], name = '', isDefault = false): void {
    const newEntry: AclEntry = {
      id: `${isDefault ? 'd' : 'a'}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type,
      name,
      permissions: {
        read: true,
        write: false,
        execute: false,
      },
      isDefault,
    };

    const entries = isDefault ? this.defaultEntries() : this.accessEntries();
    const updatedEntries = [...entries, newEntry];

    if (isDefault) {
      this.defaultEntries.set(updatedEntries);
    } else {
      this.accessEntries.set(updatedEntries);
      this.updateValidation();
    }
  }

  validateAclConfiguration(): { isValid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];
    const accessEntries = this.accessEntries();

    // Check for required entries
    const hasUserObj = accessEntries.some((entry) => entry.type === 'USER_OBJ');
    const hasGroupObj = accessEntries.some((entry) => entry.type === 'GROUP_OBJ');
    const hasOther = accessEntries.some((entry) => entry.type === 'OTHER');

    if (!hasUserObj) errors.push('Missing required USER_OBJ (Owner) entry');
    if (!hasGroupObj) errors.push('Missing required GROUP_OBJ (Group) entry');
    if (!hasOther) errors.push('Missing required OTHER entry');

    // Check for MASK requirements
    const hasNamedUsers = accessEntries.some((entry) => entry.type === 'USER');
    const hasNamedGroups = accessEntries.some((entry) => entry.type === 'GROUP');
    const hasMask = accessEntries.some((entry) => entry.type === 'MASK');

    if ((hasNamedUsers || hasNamedGroups) && !hasMask) {
      warnings.push('MASK entry is recommended when using named users or groups');
    }

    // Check for duplicate entries
    const seenEntries = new Set<string>();
    for (const entry of accessEntries) {
      const key = `${entry.type}-${entry.name}`;
      if (seenEntries.has(key)) {
        errors.push(`Duplicate entry found: ${this.getTypeDisplayName(entry.type)} ${entry.name || ''}`);
      }
      seenEntries.add(key);
    }

    // Check for potentially dangerous permissions
    const otherEntry = accessEntries.find((entry) => entry.type === 'OTHER');
    if (otherEntry?.permissions.write) {
      warnings.push('Other users have write access - this may be a security risk');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }

  readonly validationResult = signal(this.validateAclConfiguration());

  updateValidation(): void {
    this.autoHandleMaskEntries();
    this.validationResult.set(this.validateAclConfiguration());
  }

  editEntry(entry: AclEntry): void {
    const isFromDefaultArray = entry.isDefault || false;

    const dialogRef = this.dialog.open(AclEntryEditModalComponent, {
      data: {
        entry: { ...entry },
        isDefault: isFromDefaultArray,
      },
      width: '600px',
      maxHeight: '90vh',
    });

    // eslint-disable-next-line rxjs-angular/prefer-takeuntil -- using takeUntilDestroyed
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: AclEntry | undefined) => {
      if (result) {
        // Update the entry in the same array it came from (ACCESS or DEFAULT)
        if (isFromDefaultArray) {
          const updatedEntries = this.defaultEntries().map((item) => (item.id === result.id ? result : item));
          this.defaultEntries.set(updatedEntries);
        } else {
          const updatedEntries = this.accessEntries().map((item) => (item.id === result.id ? result : item));
          this.accessEntries.set(updatedEntries);
          this.updateValidation();
        }
      }
    });
  }
}
