import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  public currentTheme = signal<ThemeMode>('system');

  private systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    this.systemPrefersDark.addEventListener('change', (e) => {
      if (this.currentTheme() === 'system') {
        this.applyTheme('system');
      }
    });
  }

  loadTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as ThemeMode;
    const theme = savedTheme || 'system';
    this.setTheme(theme);
  }

  setTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
    localStorage.setItem(this.THEME_KEY, theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: ThemeMode): void {
    const rootElement = document.documentElement;

    rootElement.classList.remove('light', 'dark');

    let effectiveTheme: 'light' | 'dark';

    if (theme === 'system') {
      effectiveTheme = this.systemPrefersDark.matches ? 'dark' : 'light';
    } else {
      effectiveTheme = theme;
    }

    rootElement.classList.add(effectiveTheme);

    console.log(`Theme applied: ${theme} (effective: ${effectiveTheme})`);
  }

  getCurrentEffectiveTheme(): 'light' | 'dark' {
    const theme = this.currentTheme();
    if (theme === 'system') {
      return this.systemPrefersDark.matches ? 'dark' : 'light';
    }
    return theme;
  }
}
