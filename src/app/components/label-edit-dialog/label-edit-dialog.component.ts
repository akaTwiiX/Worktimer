import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-label-edit-dialog',
  standalone: true,
  imports: [
    FormsModule,
    InputTextModule,
    FloatLabelModule,
    ButtonModule,
    CheckboxModule,
  ],
  templateUrl: './label-edit-dialog.component.html',
  styleUrl: './label-edit-dialog.component.scss',
})
export class LabelEditDialogComponent {
  newLabel: string;
  isActive: boolean;

  public dialogRef = inject(DynamicDialogRef);
  public config = inject<DynamicDialogConfig<{ label: string, title?: string, isActive: boolean, }>>(DynamicDialogConfig);

  constructor() {
    this.newLabel = this.config.data!.label;
    this.isActive = this.config.data!.isActive ?? false;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close({ label: this.newLabel, isActive: this.isActive });
  }

  isDisabled(): boolean {
    const isLabelEmpty = this.newLabel.length === 0;
    const noChanges = this.newLabel === this.config.data!.label && this.isActive === (this.config.data!.isActive ?? false);
    return isLabelEmpty || noChanges;
  }
}
