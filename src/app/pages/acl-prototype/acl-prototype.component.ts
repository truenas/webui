import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardTitle } from '@angular/material/card';
import { MatChip } from '@angular/material/chips';
import { MatExpansionPanel, MatExpansionPanelHeader } from '@angular/material/expansion';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

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
    MatCardTitle,
    MatChip,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatTooltip,
    TranslateModule,
    IxIconComponent,
  ],
})
export class AclPrototypeComponent {
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
      name: 'Open Dataset',
      description: 'Full access for owner, read/write for group, read-only for others',
      entries: [
        {
          id: 'p1',
          type: 'USER_OBJ',
          name: 'owner',
          permissions: {
            read: true,
            write: true,
            execute: true,
          },
        },
        {
          id: 'p2',
          type: 'GROUP_OBJ',
          name: 'group',
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
            execute: false,
          },
        },
      ],
    },
    {
      name: 'Restricted Dataset',
      description: 'Full access for owner, read-only for group, no access for others',
      entries: [
        {
          id: 'p4',
          type: 'USER_OBJ',
          name: 'owner',
          permissions: {
            read: true,
            write: true,
            execute: true,
          },
        },
        {
          id: 'p5',
          type: 'GROUP_OBJ',
          name: 'group',
          permissions: {
            read: true,
            write: false,
            execute: false,
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
      name: 'Collaborative Workspace',
      description: 'Full access for specific users and groups, read-only for others',
      entries: [
        {
          id: 'p7',
          type: 'USER_OBJ',
          name: 'owner',
          permissions: {
            read: true,
            write: true,
            execute: true,
          },
        },
        {
          id: 'p8',
          type: 'GROUP_OBJ',
          name: 'group',
          permissions: {
            read: true,
            write: true,
            execute: true,
          },
        },
        {
          id: 'p9',
          type: 'USER',
          name: 'collaborator',
          permissions: {
            read: true,
            write: true,
            execute: true,
          },
        },
        {
          id: 'p10',
          type: 'GROUP',
          name: 'team',
          permissions: {
            read: true,
            write: true,
            execute: true,
          },
        },
        {
          id: 'p11',
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
  readonly showPresets = signal(true);
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
      OTHER: 'public',
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
    // In a real implementation, this would update the ACL entries
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

  addMissingMaskEntries(): void {
    const currentEntries = this.accessEntries();
    const hasNamedUsersOrGroups = currentEntries.some((entry) => entry.type === 'USER' || entry.type === 'GROUP');
    const hasMask = currentEntries.some((entry) => entry.type === 'MASK');

    if (hasNamedUsersOrGroups && !hasMask) {
      const newMask: AclEntry = {
        id: `mask-${Date.now()}`,
        type: 'MASK',
        name: '',
        permissions: {
          read: true,
          write: true,
          execute: true,
        },
      };
      this.accessEntries.set([...currentEntries, newMask]);
    }
  }

  toggleAdvancedOptions(): void {
    this.showAdvancedOptions.set(!this.showAdvancedOptions());
  }
}
