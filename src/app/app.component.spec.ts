import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { AnalyticsRepository } from './core/repositories/analytics.repository';
import { MockAnalyticsRepository } from './core/repositories/mock-analytics.repository';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsRepository, useClass: MockAnalyticsRepository }
      ]
    }).compileComponents();
  });

  it('should create the application root', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'commerce-spa' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('commerce-spa');
  });
});
