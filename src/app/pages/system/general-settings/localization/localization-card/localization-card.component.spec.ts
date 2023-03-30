import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocalizationCardComponent } from './localization.component';

describe('LocalizationCardComponent', () => {
  let component: LocalizationCardComponent;
  let fixture: ComponentFixture<LocalizationCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LocalizationCardComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(LocalizationCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
