import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
    selector: 'app-label-edit-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCheckboxModule
    ],
    templateUrl: './label-edit-dialog.component.html',
    styleUrl: './label-edit-dialog.component.scss'
})
export class LabelEditDialogComponent {
    newLabel: string;
    isActive: boolean;

    constructor(
        public dialogRef: MatDialogRef<LabelEditDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { label: string, title?: string, isActive: boolean }
    ) {
        this.newLabel = data.label;
        this.isActive = data.isActive;
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        this.dialogRef.close({ label: this.newLabel, isActive: this.isActive });
    }
}
