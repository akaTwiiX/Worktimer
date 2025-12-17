import { Component } from '@angular/core';
import { ThemeService, ThemeMode } from '../theme.service';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-theme-toggle',
  imports: [MatButtonToggleModule],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent {
  constructor(protected themeService: ThemeService) { }

  onThemeChange(theme: ThemeMode): void {
    this.themeService.setTheme(theme);
  }
}
