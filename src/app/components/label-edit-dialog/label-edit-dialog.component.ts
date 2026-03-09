import { Component } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
    selector: 'app-label-edit-dialog',
    standalone: true,
    imports: [
        FormsModule,
        InputTextModule,
        FloatLabelModule,
        ButtonModule,
        CheckboxModule
    ],
    templateUrl: './label-edit-dialog.component.html',
    styleUrl: './label-edit-dialog.component.scss'
})
export class LabelEditDialogComponent {
    newLabel: string;
    isActive: boolean;

    constructor(
        public dialogRef: DynamicDialogRef,
        public config: DynamicDialogConfig<{ label: string; title?: string; isActive: boolean }>
    ) {
        this.newLabel = config.data!.label;
        this.isActive = config.data!.isActive ?? false;
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
