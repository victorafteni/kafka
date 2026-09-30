import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppFlagComponent } from './app-flag.component';

describe('AppFlagComponent', () => {
  let component: AppFlagComponent;
  let fixture: ComponentFixture<AppFlagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppFlagComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AppFlagComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render Romanian flag SVG when lang is "ro"', () => {
    component.lang = 'ro';
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('aria-label')).toBe('Steagul României');
  });

  it('should render UK flag SVG when lang is "en"', () => {
    component.lang = 'en';
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('aria-label')).toBe('United Kingdom Flag');
  });
});
