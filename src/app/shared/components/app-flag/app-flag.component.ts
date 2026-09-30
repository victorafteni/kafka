import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-flag',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (lang === 'ro') {
      <svg class="flag-svg" viewBox="0 0 640 480" width="20" height="14" aria-label="Steagul României">
        <rect width="213.3" height="480" fill="#002B7F"/>
        <rect x="213.3" width="213.4" height="480" fill="#FCD116"/>
        <rect x="426.7" width="213.3" height="480" fill="#CE1126"/>
      </svg>
    } @else if (lang === 'en' || lang === 'gb') {
      <svg class="flag-svg" viewBox="0 0 640 480" width="20" height="14" aria-label="United Kingdom Flag">
        <path fill="#012169" d="M0 0h640v480H0z"/>
        <path fill="#FFF" d="m75 0 245 180L565 0h75v60L435 240l205 150v90h-75L320 300 75 480H0v-60l205-150L0 120V0h75z"/>
        <path fill="#C8102E" d="m425 285 215 155v40L395 300l30-15zm-210-90L0 40V0l245 180-30 15zm270-195h75L320 210l-30-20L520 0h-35zm-400 480H45L285 300l30 20L120 480h-35z"/>
        <path fill="#FFF" d="M260 0h120v480H260zM0 180h640v120H0z"/>
        <path fill="#C8102E" d="M280 0h80v480H280zM0 200h640v80H0z"/>
      </svg>
    }
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      line-height: 0;
    }

    .flag-svg {
      display: block;
      width: 20px;
      height: 14px;
      border-radius: 2px;
      overflow: hidden;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2), 0 1px 3px rgba(0, 0, 0, 0.3);
      vertical-align: middle;
      flex-shrink: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFlagComponent {
  @Input({ required: true }) lang: string = 'ro';
}
