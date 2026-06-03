import { Component, computed, inject } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  selector: 'app-dashboard-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="hidden md:block" aria-label="Breadcrumb">
      <ol class="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        @for (item of breadcrumbs(); track item.url; let last = $last) {
          <li class="flex items-center gap-2">
            @if (!last) {
              <a
                [routerLink]="item.url"
                class="transition hover:text-slate-700 dark:hover:text-slate-200"
              >
                {{ item.label }}
              </a>
              <span>/</span>
            } @else {
              <span class="font-medium text-slate-800 dark:text-slate-200">{{ item.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class DashboardBreadcrumbComponent {
  private readonly router = inject(Router);

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly breadcrumbs = computed(() => {
    const url = this.currentUrl();
    const segments = url.split('/').filter(Boolean);

    const result: BreadcrumbItem[] = [];
    let cumulative = '';

    for (const segment of segments) {
      cumulative += `/${segment}`;
      result.push({
        label: this.pretty(segment),
        url: cumulative,
      });
    }

    return result;
  });

  private pretty(value: string): string {
    if (value === 'dashboard') return 'Dashboard';
    if (value === 'home') return 'Overview';
    return value
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
  }
}
