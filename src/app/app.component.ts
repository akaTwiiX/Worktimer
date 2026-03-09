import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'Worktimer';
  private themeService = inject(ThemeService);

  ngOnInit(): void {
    this.themeService.loadTheme();
  }
}
