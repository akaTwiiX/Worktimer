import type { ThemeMode } from '../../theme.service';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ThemeService } from '../../theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [SelectButtonModule, FormsModule],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  themeOptions = [
    { label: '☀️', value: 'light' },
    { label: '🌙', value: 'dark' },
    { label: '💻', value: 'system' },
  ];

  protected themeService = inject(ThemeService);

  onThemeChange(theme: ThemeMode): void {
    if (theme) {
      this.themeService.setTheme(theme);
    }
  }
}
