import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetadataDetailsCardComponent } from './metadata-details-card.component';

describe('MetadataDetailsCardComponent', () => {
  let component: MetadataDetailsCardComponent;
  let fixture: ComponentFixture<MetadataDetailsCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MetadataDetailsCardComponent],
    });
    fixture = TestBed.createComponent(MetadataDetailsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
