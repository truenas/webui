import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SupportCardComponent } from './support-card.component';

describe('SupportCardComponent', () => {
  let component: SupportCardComponent;
  let fixture: ComponentFixture<SupportCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SupportCardComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(SupportCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
