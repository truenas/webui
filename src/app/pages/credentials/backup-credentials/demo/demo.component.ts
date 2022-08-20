import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { idNameArrayToOptions } from 'app/helpers/options.helper';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { KeychainCredentialService, ReplicationService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Component({
  templateUrl: './demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ReplicationService],
})
export class DemoComponent implements OnInit {
  credential = new FormControl(null as number);
  selectedThings = new FormControl([] as (string[] | string));
  multiple = new FormControl(true);
  disabled = new FormControl(false);

  connections$ = this.keychainCredentialService.getSshConnections().pipe(idNameArrayToOptions());

  treeNodeProvider: TreeNodeProvider;

  constructor(
    private keychainCredentialService: KeychainCredentialService,
    private replicationService: ReplicationService,
    private filesystemService: FilesystemService,
  ) { }

  ngOnInit(): void {
    this.multiple.valueChanges.pipe(untilDestroyed(this)).subscribe(
      (multiple) => {
        this.selectedThings.setValue(multiple ? [] : '');
      },
    );

    this.disabled.valueChanges.pipe(untilDestroyed(this)).subscribe(
      (disabled) => {
        this.selectedThings.setDisable(disabled);
      },
    );

    this.credential.valueChanges.pipe(untilDestroyed(this)).subscribe(
      (credential) => {
        this.treeNodeProvider = this.replicationService.getTreeNodeProvider({
          sshCredential: credential,
          transport: TransportMode.Ssh,
        });
      },
    );
  }
}
