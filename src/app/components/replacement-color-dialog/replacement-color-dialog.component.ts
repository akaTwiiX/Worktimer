import { Component, Inject, signal } from '@angular/core';

import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ThemeColors } from '../../color.themes';

@Component({
  selector: 'app-replacement-color-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './replacement-color-dialog.component.html',
  styleUrl: './replacement-color-dialog.component.scss',
})
export class ReplacementColorDialogComponent {
  newColorId = signal<number | null>(null);
  constructor(
    public dialogRef: MatDialogRef<ReplacementColorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { colors: ThemeColors[], originalColor: ThemeColors }
  ) { }

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
