import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'benefitflow-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly darkMode = signal(false);

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    this.darkMode.set(stored === 'dark');
    this.applyTheme();
  }

  toggle(): void {
    const next = !this.darkMode();
    this.darkMode.set(next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle('dark', this.darkMode());
  }
}
