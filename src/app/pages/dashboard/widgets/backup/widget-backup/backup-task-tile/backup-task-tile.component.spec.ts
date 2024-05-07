import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { BackupTaskTileComponent } from './backup-task-tile.component';

describe('BackupTaskTileComponent', () => {
  let spectator: Spectator<BackupTaskTileComponent>;
  const createComponent = createComponentFactory({
    component: BackupTaskTileComponent,
    declarations: [FakeFormatDateTimePipe],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  describe('Conditional rendering based on tile input', () => {
    it('should display tile content if tile is provided', () => {
      const mockTile = {
        title: 'Backup Summary',
        totalSend: 5,
        failedSend: 1,
        totalReceive: 3,
        failedReceive: 0,
        lastWeekSend: 2,
        lastWeekReceive: 1,
      };
      spectator.setInput('tile', mockTile);
      spectator.detectChanges();

      expect(spectator.query('.title')).toHaveText('Backup Summary');
      expect(spectator.queryAll('.label')[1]).toHaveText('3 receive tasks');
      expect(spectator.queryAll('.label')[2]).toHaveText('Total failed: 1');
      expect(spectator.queryAll('.label')[3]).toHaveText('2 sent tasks this week');
      expect(spectator.queryAll('.label')[4]).toHaveText('1 received task this week');
      expect(spectator.queryAll('.label')[5]).toHaveText('Last successful: Never');
    });

    it('should not display tile content if tile is not provided', () => {
      spectator.setInput('tile', null);
      spectator.detectChanges();

      expect(spectator.query('.tile')).not.toExist();
    });
  });

  describe('Conditional rendering within tile based on hasSendTasks', () => {
    it('should show backup actions if hasSendTasks is true and totalSend is 0', () => {
      const mockTile = {
        title: 'No Send Tasks',
        totalSend: 0,
        failedSend: 0,
        totalReceive: 2,
        failedReceive: 1,
      };
      spectator.setInput('tile', mockTile);
      spectator.setInput('hasSendTasks', true);
      spectator.detectChanges();

      expect(spectator.query('.backup-actions')).toExist();
    });
  });

  describe('Dynamic content based on tile properties', () => {
    it('should display correct classes and icons based on task failure', () => {
      const mockTile = {
        failedSend: 1,
        failedReceive: 0,
      };
      spectator.setInput('tile', mockTile);
      spectator.detectChanges();

      expect(spectator.query('.icon.warn')).toExist();
      expect(spectator.query('.icon.safe')).toExist();
    });
  });
});
