import { Component } from '@angular/core';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { ThemeMode, ThemeService } from '../../theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [SelectButtonModule, FormsModule],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent {
  themeOptions = [
    { label: '☀️', value: 'light' },
    { label: '🌙', value: 'dark' },
    { label: '💻', value: 'system' },
  ];

  constructor(protected themeService: ThemeService) { }

  onThemeChange(theme: ThemeMode): void {
    if (theme) {
      this.themeService.setTheme(theme);
    }
  }
}
