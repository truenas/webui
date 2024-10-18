import { MatButtonModule } from '@angular/material/button';
import { Spectator, byText, createComponentFactory } from '@ngneat/spectator/jest';
import { BottomSheetService } from 'app/services/bottom-sheet.service';
import { FormHeaderActionsComponent } from './form-header-actions.component';

describe('FormHeaderActionsComponent', () => {
  let spectator: Spectator<FormHeaderActionsComponent>;
  let bottomSheetService: BottomSheetService;

  const createComponent = createComponentFactory({
    component: FormHeaderActionsComponent,
    declarations: [],
    imports: [MatButtonModule],
    providers: [
      BottomSheetService,
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    bottomSheetService = spectator.inject(BottomSheetService);
  });

  it('should have the correct title input', () => {
    spectator.setInput('title', 'Test Title');
    expect(spectator.query('.title')).toHaveText('Test Title');
  });

  it('should close panel when Cancel button pressed', () => {
    const closeSpy = jest.spyOn(bottomSheetService, 'close');
    spectator.click(byText('Cancel'));
    expect(closeSpy).toHaveBeenCalled();
  });
});
