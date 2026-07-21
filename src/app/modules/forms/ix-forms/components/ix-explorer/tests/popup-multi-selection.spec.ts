import { ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@ngneat/reactive-forms';
import { SpectatorHost } from '@ngneat/spectator';
import { createHostFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnFilePickerComponent } from '@truenas/ui-components';
import { of } from 'rxjs';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

/**
 * Regression test for the popup multi-selection flow driven through the REAL
 * rendered popup DOM. tn-checkbox used to double-fire ancestor `(change)`
 * bindings (component output + bubbling native event), which toggled every
 * checkbox selection on and immediately off — submitting then fell back to
 * the browsed directory instead of the checked items.
 */
describe('ix-explorer popup multi-selection', () => {
  const nodes: Record<string, ExplorerNodeData[]> = {
    '': [{
      path: 'dozer', name: 'dozer', type: ExplorerNodeType.Directory, hasChildren: true, isMountpoint: true,
    }],
    dozer: [
      {
        path: 'dozer/foo', name: 'foo', type: ExplorerNodeType.Directory, hasChildren: false, isMountpoint: true,
      },
      {
        path: 'dozer/bar', name: 'bar', type: ExplorerNodeType.Directory, hasChildren: false, isMountpoint: true,
      },
    ],
  };
  const provider = jest.fn((node: { data: { path: string } }) => of(nodes[node.data.path] ?? []));

  let spectator: SpectatorHost<IxExplorerComponent>;
  const formControl = new FormControl<string | string[]>();
  const createHost = createHostFactory({
    component: IxExplorerComponent,
    imports: [ReactiveFormsModule],
    providers: [mockProvider(ErrorParserService)],
  });

  function flush(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve);
    });
  }

  afterEach(() => {
    spectator.query(TnFilePickerComponent)?.close();
  });

  it('applies a selection built by clicking row checkboxes across navigation', async () => {
    spectator = createHost(
      `<ix-explorer
        [formControl]="formControl"
        [nodeProvider]="nodeProvider"
        [rootNodes]="roots"
        [multiple]="true"
      ></ix-explorer>`,
      {
        hostProps: {
          formControl,
          nodeProvider: provider,
          roots: [{
            path: '', name: '', hasChildren: true, type: ExplorerNodeType.Directory,
          }],
        },
      },
    );
    const picker = spectator.query(TnFilePickerComponent)!;

    picker.openFilePicker();
    await flush();
    picker.navigateToPath('/dozer');
    await flush();
    spectator.detectChanges();

    const popup = document.querySelector('tn-file-picker-popup')!;
    const checkboxes = Array.from(popup.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    expect(checkboxes).toHaveLength(2);

    checkboxes[0].click();
    spectator.detectChanges();
    checkboxes[1].click();
    spectator.detectChanges();

    expect(picker.selectedItems()).toEqual(['/dozer/foo', '/dozer/bar']);

    const selectButton = Array.from(popup.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.trim() === 'Select')!;
    selectButton.click();
    await flush();
    spectator.detectChanges();

    expect(formControl.value).toEqual(['dozer/foo', 'dozer/bar']);
    // The input displays dataset names, not slash-rooted browse paths.
    expect(spectator.query<HTMLInputElement>('tn-file-picker input')!.value).toBe('dozer/foo, dozer/bar');
  });
});
