import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-card',
  standalone: true,
  template: `
    <section class="content-card">
      @if (title || subtitle) {
        <div class="mb-6">
          @if (title) {
            <h2 class="text-xl font-bold text-slate-900 dark:text-white">{{ title }}</h2>
          }
          @if (subtitle) {
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ subtitle }}</p>
          }
        </div>
      }

      <ng-content />
    </section>
  `,
})
export class SectionCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
