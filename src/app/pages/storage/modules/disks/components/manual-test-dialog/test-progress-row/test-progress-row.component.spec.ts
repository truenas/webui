import { MatProgressBar } from '@angular/material/progress-bar';
import { mockProvider, Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { SmartTestType } from 'app/enums/smart-test-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { SmartTestProgressUpdate } from 'app/interfaces/smart-test-progress.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TestProgressRowComponent } from 'app/pages/storage/modules/disks/components/manual-test-dialog/test-progress-row/test-progress-row.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';

describe('IxTestProgressRowComponent', () => {
  let spectator: Spectator<TestProgressRowComponent>;

  const createComponent = createComponentFactory({
    component: TestProgressRowComponent,
    imports: [
      IxIconComponent,
      MatProgressBar,
      TestDirective,
    ],
    providers: [
      mockProvider(DialogService, {
        info: jest.fn(() => of(true)),
        error: jest.fn(() => of(true)),
      }),
      mockProvider(ErrorHandlerService),
      mockApi(),
    ],
  });

  describe('Before tests started', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          disk: { name: 'sdd', serial: 'serial', identifier: 'identifier' } as Disk,
          loading: false,
          testType: SmartTestType.Short,
          testStartError: null,
          testStarted: false,
        },
      });
    });

    it('shows disk name', () => {
      const h4 = spectator.query('h4');
      expect(h4.textContent).toBe('sdd (serial)');
    });

    it('doesnt show progress bar', () => {
      const progressBar = spectator.query(MatProgressBar);
      expect(progressBar).toBeFalsy();
    });

    it('doesnt show error or success icons', () => {
      const ixIcons = spectator.queryAll(IxIconComponent);

      expect(ixIcons.length).toBeFalsy();
    });

    it('doesnt show view logs link', () => {
      const link = spectator.query('a');
      expect(link).toBeFalsy();
    });
  });

  describe('After tests started', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          disk: { name: 'sdd', serial: 'serial', identifier: 'identifier' } as Disk,
          loading: true,
          testType: SmartTestType.Short,
          testStartError: null,
          testStarted: true,
        },
      });
    });

    it('shows disk name', () => {
      const h4 = spectator.query('h4');
      expect(h4.textContent).toBe('sdd (serial)');
    });

    it('shows progress bar', () => {
      const progressBar = spectator.query(MatProgressBar);
      expect(progressBar).toBeTruthy();
    });

    it('doesnt show error or success icons', () => {
      const ixIcons = spectator.queryAll(IxIconComponent);

      expect(ixIcons.length).toBeFalsy();
    });

    it('show view logs link', () => {
      const link = spectator.query('a');
      expect(link).toBeFalsy();
    });

    it('shows progress change', () => {
      const websocketMock = spectator.inject(MockApiService);
      websocketMock.emitSubscribeEvent({
        msg: CollectionChangeType.Added,
        collection: 'smart.test.progerss:sdd',
        fields: {
          progress: 15,
        } as SmartTestProgressUpdate,
      });

      spectator.detectChanges();

      const progressBar = spectator.query(MatProgressBar);
      expect(progressBar.value).toBe(15);
    });

    it('shows success icon when test is done', () => {
      const websocketMock = spectator.inject(MockApiService);
      websocketMock.emitSubscribeEvent({
        msg: CollectionChangeType.Added,
        collection: 'smart.test.progerss:sdd',
        fields: {
          progress: 15,
        } as SmartTestProgressUpdate,
      });
      spectator.detectChanges();
      websocketMock.emitSubscribeEvent({
        msg: CollectionChangeType.Added,
        collection: 'smart.test.progerss:sdd',
        fields: {
          progress: null,
        } as SmartTestProgressUpdate,
      });
      spectator.detectChanges();

      const progressBar = spectator.query(MatProgressBar);
      expect(progressBar).toBeFalsy();

      const icons = spectator.queryAll(IxIconComponent);
      expect(icons).toHaveLength(1);
      expect(icons[0].name()).toBe('check_circle');

      const link = spectator.query('a');
      expect(link).toBeFalsy();
    });
  });

  describe('After tests started as failed', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          disk: { name: 'sdd', serial: 'serial', identifier: 'identifier' } as Disk,
          loading: true,
          testType: SmartTestType.Short,
          testStartError: 'Error',
          testStarted: true,
        },
      });
    });

    it('shows logs link and error icon', () => {
      const icons = spectator.queryAll(IxIconComponent);
      expect(icons).toHaveLength(1);
      expect(icons[0].name()).toBe('error');

      const link = spectator.query('a');
      expect(link).toBeTruthy();
      expect(link.textContent).toBe(' View logs ');
    });

    it('shows dialog info with error log', () => {
      const link = spectator.query('a');
      link.dispatchEvent(new Event('click'));

      expect(spectator.inject(DialogService).info).toHaveBeenCalledWith(
        'SHORT S.M.A.R.T. Test Logs: sdd',
        'Error',
        true,
      );
    });
  });
});
