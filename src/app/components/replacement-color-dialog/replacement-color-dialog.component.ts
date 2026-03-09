import { Component, signal } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { ThemeColors } from '../../color.themes';

@Component({
  selector: 'app-replacement-color-dialog',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './replacement-color-dialog.component.html',
  styleUrl: './replacement-color-dialog.component.scss',
})
export class ReplacementColorDialogComponent {
  newColorId = signal<number | null>(null);

  data: { colors: ThemeColors[]; originalColor: ThemeColors };

  constructor(
    public dialogRef: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.data = config.data;
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
