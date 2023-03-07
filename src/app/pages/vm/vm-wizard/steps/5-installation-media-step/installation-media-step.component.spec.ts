import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InstallationMediaStepComponent } from './installation-media-step.component';

describe('InstallationMediaStepComponent', () => {
  let component: InstallationMediaStepComponent;
  let fixture: ComponentFixture<InstallationMediaStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InstallationMediaStepComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(InstallationMediaStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
