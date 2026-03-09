import { Component, inject, input, model, output } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { LabelEditDialogComponent } from '../label-edit-dialog/label-edit-dialog.component';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

@Component({
    selector: 'app-color-picker',
    standalone: true,
    imports: [InputTextModule, FloatLabelModule, DynamicDialogModule, ButtonModule, InputGroupModule, InputGroupAddonModule],
    providers: [DialogService],
    templateUrl: './color-picker.component.html',
    styleUrl: './color-picker.component.scss'
})
export class ColorPickerComponent {
    private dialogService = inject(DialogService);

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
        const ref = this.dialogService.open(LabelEditDialogComponent, {
            header: 'Label bearbeiten',
            width: '300px',
            dismissableMask: true,
            data: { label: this.label(), isActive: this.isActive() }
        });

        ref?.onClose.subscribe(result => {
            if (result) {
                this.label.set(result.label);
                this.isActive.set(result.isActive);
            }
        });
    }
}
