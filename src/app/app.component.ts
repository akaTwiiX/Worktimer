import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProgressSpinner } from 'primeng/progressspinner';
import { SettingsService } from './settings.service';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProgressSpinner],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'Worktimer';
  private themeService = inject(ThemeService);
  public settingsService = inject(SettingsService);

  ngOnInit(): void {
    this.themeService.loadTheme();
  }
}
