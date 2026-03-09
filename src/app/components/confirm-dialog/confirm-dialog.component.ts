import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  data: { title: string, message: string, confirmText?: string, };
  public dialogRef = inject(DynamicDialogRef);
  public config = inject(DynamicDialogConfig);

  constructor() {
    this.data = this.config.data;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
