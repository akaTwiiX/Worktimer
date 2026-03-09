import type { OnDestroy } from '@angular/core';
import type { FullCalendarComponent } from '@fullcalendar/angular';
import type { CalendarOptions, EventInput } from '@fullcalendar/core';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { EventDialogComponent } from '../../components/event-dialog/event-dialog.component';
import { auth, db } from '../../firebase-config';
import { SettingsService } from '../../settings.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule, ButtonModule, DynamicDialogModule],
  providers: [DialogService],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent implements OnDestroy {
  @ViewChild('calendar') calendarRef!: FullCalendarComponent;

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    editable: true,
    selectable: false,
    events: [],
    dateClick: this.handleDateClick.bind(this),
    locale: 'de',
    timeZone: 'Europe/Berlin',
    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: 'today',
    },
    eventStartEditable: true,
    eventDurationEditable: true,
    selectMirror: false,
    unselectAuto: true,
    longPressDelay: 500,
    eventLongPressDelay: 500,
    firstDay: 1,
    slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    datesSet: this.handleDatesSet.bind(this),
    eventContent: (arg) => {
      return { html: arg.event.title };
    },
  };

  private settingsService = inject(SettingsService);
  private dialogService = inject(DialogService);
  private unsubscribe: (() => void) | null = null;
  private touchStartX = 0;
  private touchEndX = 0;
  private originalEvents: EventInput[] = [];

  totalTime = 0;
  totalPause = 0;

  private lastSnapshotDocs: any[] | null = null;
  private currentMonthStartISO: string = '';
  private currentMonthEndISO: string = '';
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      const colors = this.settingsService.settings().themeColors;
      if (this.lastSnapshotDocs) {
        this.runWorker(this.lastSnapshotDocs, colors);
      }
    });
  }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe() {
    const diff = this.touchEndX - this.touchStartX;
    const calendarApi = this.calendarRef.getApi();

    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        calendarApi.next();
      } else {
        calendarApi.prev();
      }
    }
  }

  private runWorker(docs: any[], colors: any[]) {
    const worker = new Worker(new URL('../../worker/event-processor.worker', import.meta.url));
    worker.onmessage = ({ data }) => {
      this.totalTime = data.totalTime;
      this.totalPause = data.totalPause;
      this.originalEvents = data.originalEvents;
      this.calendarOptions.events = data.mergedEvents;
      this.cdr.markForCheck();
      worker.terminate();
    };

    worker.postMessage({
      docs,
      colors,
      currentMonthStart: this.currentMonthStartISO,
      currentMonthEnd: this.currentMonthEndISO,
    });
  }

  handleDatesSet(dateInfo: any) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    this.currentMonthStartISO = currentMonthStart.toISOString();
    this.currentMonthEndISO = currentMonthEnd.toISOString();

    const start = new Date(dateInfo.startStr);
    const end = new Date(dateInfo.endStr);

    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59);

    if (this.unsubscribe) {
      this.unsubscribe();
    }
    const user = auth.currentUser;
    if (!user)
      return;

    const eventsCollection = collection(db, user.uid);
    const q = query(
      eventsCollection,
      where('start', '>=', monthStart.toISOString()),
      where('start', '<=', monthEnd.toISOString()),
    );

    this.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        this.lastSnapshotDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        this.runWorker(this.lastSnapshotDocs, this.settingsService.settings().themeColors);
      },
      (error) => {
        console.error('Error loading events:', error);
      },
    );
  }

  async handleDateClick(info: any) {
    const clickedDate = info.dateStr.split('T')[0];
    const eventForDay = this.originalEvents.find((e) => {
      const eventDate = (e.start as string).split('T')[0];
      return eventDate === clickedDate;
    });

    if (!eventForDay) {
      const ref = this.dialogService.open(EventDialogComponent, {
        header: 'Neue Arbeitszeit',
        width: '300px',
        data: { isNew: true },
        closable: true,
        dismissableMask: true,
      });

      ref?.onClose.subscribe(async (result) => {
        if (!result)
          return;

        const newEvent = {
          title: result.title,
          start: clickedDate,
          end: clickedDate,
          allDay: true,
          backgroundColor: result.backgroundColor,
          borderColor: result.backgroundColor,
          textColor: '#000000',
        };

        try {
          await addDoc(collection(db, auth.currentUser!.uid), newEvent);
        } catch (error) {
          console.error('Error creating events:', error);
        }
      });

      return;
    }

    const ref = this.dialogService.open(EventDialogComponent, {
      header: 'Arbeitszeit bearbeiten',
      width: '300px',
      data: {
        isNew: false,
        id: eventForDay.id,
        title: eventForDay.title,
        colorId: (eventForDay.extendedProps as { colorId?: string, })?.colorId,
      },
      closable: true,
      dismissableMask: true,
    });

    ref?.onClose.subscribe(async (result) => {
      if (!result)
        return;

      const eventDoc = doc(db, auth.currentUser!.uid, eventForDay.id!);

      try {
        if (result.delete) {
          await deleteDoc(eventDoc);
        } else {
          const updatedEvent = {
            title: result.title,
            start: eventForDay.start,
            end: eventForDay.end,
            allDay: true,
            backgroundColor: result.backgroundColor,
            borderColor: result.backgroundColor,
            textColor: '#000000',
          };
          await updateDoc(eventDoc, updatedEvent);
        }
      } catch (error) {
        console.error('Error update/deleting events:', error);
      }
    });
  }

  settings() {
    this.router.navigate(['/settings']);
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
