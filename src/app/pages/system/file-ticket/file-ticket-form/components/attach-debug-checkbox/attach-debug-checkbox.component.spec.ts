import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AttachDebugCheckboxComponent } from 'app/pages/system/file-ticket/file-ticket-form/components/attach-debug-checkbox/attach-debug-checkbox.component';
import { DialogService } from 'app/services/dialog.service';

describe('AttachDebugCheckboxComponent', () => {
  let spectator: Spectator<AttachDebugCheckboxComponent>;
  const createComponent = createComponentFactory({
    component: AttachDebugCheckboxComponent,
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('has a Shutdown menu item that shuts down system after confirmation', () => {
    spectator.setInput('isChecked', true);

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      buttonText: 'Agree',
      hideCheckbox: true,
      message: 'Debugs may contain log files with personal information such as usernames or other identifying information about your system. Debugs by default are attached privately to Jira tickets and only visible by iXsystem’s Engineering Staff. Please review debugs and redact any sensitive information before sharing with external entities. Debugs can be manually generated from System → Advanced → Save Debug',
    }));

    expect(spectator.component.isChecked).toBe(true);
  });
});
