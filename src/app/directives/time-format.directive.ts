import { Directive, ElementRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';

@Directive({
    selector: '[appTimeFormat]',
    standalone: true
})
export class TimeFormatDirective implements OnChanges {
    private el = inject(ElementRef);

    @Input('appTimeFormat') timeString: string | undefined;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['timeString']) {
            this.format();
        }
    }

    private format() {
        const time = this.timeString;
        if (!time || !time.includes('-')) {
            this.el.nativeElement.textContent = time || '';
            return;
        }

        const parts = time.split('-');
        if (parts.length !== 2) {
            this.el.nativeElement.textContent = time;
            return;
        }

        const formatPart = (p: string) => {
            const [h, m] = p.trim().split(':');
            const hour = h.padStart(2, '0');
            const min = (m || '00').padStart(2, '0');
            return `${hour}:${min}`;
        }

        try {
            const formatted = `${formatPart(parts[0])} - ${formatPart(parts[1])}`;
            this.el.nativeElement.textContent = formatted;
        } catch {
            this.el.nativeElement.textContent = time;
        }
    }
}
