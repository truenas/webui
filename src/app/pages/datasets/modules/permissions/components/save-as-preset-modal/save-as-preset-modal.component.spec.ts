import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaveAsPresetModalComponent } from './save-as-preset-modal.component';

describe('SaveAsPresetModalComponent', () => {
  let component: SaveAsPresetModalComponent;
  let fixture: ComponentFixture<SaveAsPresetModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SaveAsPresetModalComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(SaveAsPresetModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
