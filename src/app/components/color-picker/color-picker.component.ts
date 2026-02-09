import { Component, inject, input, model, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LabelEditDialogComponent } from '../label-edit-dialog/label-edit-dialog.component';

@Component({
    selector: 'app-color-picker',
    standalone: true,
    imports: [MatFormFieldModule, MatInputModule, MatDialogModule, MatIconModule, MatButtonModule],
    templateUrl: './color-picker.component.html',
    styleUrl: './color-picker.component.scss'
})
export class ColorPickerComponent {
    private dialog = inject(MatDialog);

    label = model<string>('Farbe wählen');
    isActive = model<boolean>(false);
    color = model<string>('#613DA2');
    disabled = input<boolean>(false);
    delete = output<void>();

    onTextChange(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        const hex = value.startsWith('#') ? value : `#${value}`;
        if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)) {
            this.color.set(hex);
        }
    }

    openEditDialog() {
        const dialogRef = this.dialog.open(LabelEditDialogComponent, {
            data: { label: this.label(), isActive: this.isActive() }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.label.set(result.label);
                this.isActive.set(result.isActive);
            }
        });
    }
}
