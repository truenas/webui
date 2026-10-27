import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnFilePickerComponent } from '@truenas/ui-components';
import { of } from 'rxjs';
import { emptyRootNode } from 'app/constants/basic-root-nodes.constant';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { FilePickerSourcePipe } from 'app/modules/forms/file-picker/file-picker-source.pipe';
import { TreeNodeProvider } from 'app/modules/forms/file-picker/tree-node-provider.interface';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

const provider: TreeNodeProvider = () => of<ExplorerNodeData[]>([{
  path: 'tank', name: 'tank', type: ExplorerNodeType.Directory, hasChildren: true, isMountpoint: true,
}]);

@Component({
  selector: 'ix-test-host',
  imports: [ReactiveFormsModule, TnFilePickerComponent, FilePickerSourcePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tn-file-picker [formControl]="control" [source]="provider | filePickerSource : roots" [allowFreeText]="true" />
  `,
})
class TestHostComponent {
  readonly control = new FormControl('');
  readonly provider = provider;
  readonly roots = [emptyRootNode];
}

describe('FilePickerSourcePipe', () => {
  let spectator: Spectator<TestHostComponent>;
  const createComponent = createComponentFactory({
    component: TestHostComponent,
    providers: [mockProvider(ErrorParserService)],
  });

  function getPicker(): TnFilePickerComponent {
    return spectator.query(TnFilePickerComponent)!;
  }

  function getInput(): HTMLInputElement {
    return spectator.query('tn-file-picker input')!;
  }

  beforeEach(() => {
    spectator = createComponent();
  });

  it('stores typed values verbatim', () => {
    const input = getInput();
    input.value = 'tank/child';
    spectator.dispatchFakeEvent(input, 'change');

    expect(spectator.component.control.value).toBe('tank/child');
  });

  it('strips the slash prefix from popup selections before they reach the form', async () => {
    await getPicker().selectPath('/tank');

    expect(spectator.component.control.value).toBe('tank');
  });

  it('shows dataset-name values verbatim in the picker input', () => {
    spectator.component.control.setValue('tank/child');
    spectator.detectChanges();

    expect(getInput()).toHaveValue('tank/child');
  });

  it('builds the source once for unchanged arguments', () => {
    const source = getPicker().source();
    spectator.component.control.setValue('tank');
    spectator.detectChanges();

    expect(getPicker().source()).toBe(source);
  });
});
