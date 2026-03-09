import type { ThemeColors } from '../../color.themes';
import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-replacement-color-dialog',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './replacement-color-dialog.component.html',
  styleUrl: './replacement-color-dialog.component.scss',
})
export class ReplacementColorDialogComponent {
  public dialogRef = inject(DynamicDialogRef);
  public config = inject(DynamicDialogConfig);

  newColorId = signal<number | null>(null);

  data: { colors: ThemeColors[], originalColor: ThemeColors, };

  constructor() {
    this.data = this.config.data;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSelect(id: number): void {
    this.newColorId.set(id);
  }

  onSave(): void {
    this.dialogRef.close(this.newColorId());
  }
}
