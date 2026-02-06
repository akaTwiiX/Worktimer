/// <reference lib="webworker" />

import { EventInput } from '@fullcalendar/core';

addEventListener('message', ({ data }) => {
    const { docs, colors, currentMonthStart, currentMonthEnd } = data;

    let sum = 0;
    let pause = 0;

    const events: EventInput[] = docs.map((docData: any) => {
        const colorId = docData['backgroundColor'];
        const color = colors.find((c: any) => c.id === colorId)?.value || '#FFFFFF';
        const eventStart = new Date(docData['start']);

        const isStartInMonth =
            eventStart >= new Date(currentMonthStart) && eventStart <= new Date(currentMonthEnd);

        if (isStartInMonth) {
            let title = docData['title'];

            if (title.includes('<small>Kasse:</small>')) {
                let numbers = title.split('<small>Kasse:</small>');
                numbers = numbers[0].trim();

                let numParts = numbers.split('-');
                if (numParts.length === 2) {
                    let numStart = parseInt(numParts[0].trim(), 10);
                    let numEnd = parseInt(numParts[1].trim(), 10);

                    if (!isNaN(numStart) && !isNaN(numEnd)) {
                        let daySum = numEnd - numStart;
                        if (daySum >= 6 && daySum < 8) {
                            pause += 0.25;
                        } else if (daySum >= 8) {
                            pause += 0.5;
                        }
                        sum += daySum;
                    }
                }
            }
        }

        return {
            id: docData.id,
            title: docData['title'],
            start: docData['start'],
            end: docData['end'],
            allDay: true,
            backgroundColor: color,
            borderColor: color,
            textColor: '#000000'
        };
    });

    const sortedEvents = events.sort(
        (a, b) =>
            new Date(a.start as string).getTime() -
            new Date(b.start as string).getTime()
    );

    const mergedEvents = mergeEvents(sortedEvents);

    postMessage({
        totalTime: sum,
        totalPause: pause,
        originalEvents: sortedEvents,
        mergedEvents: mergedEvents
    });
});

function mergeEvents(events: EventInput[]): EventInput[] {
    if (!events.length) return [];

    const merged: EventInput[] = [];
    let blockStart = events[0].start as string;
    let blockEnd = events[0].start as string;
    let currentTitle = events[0].title;
    let currentColor = events[0].backgroundColor;

    function pushBlock() {
        const endDate = new Date(blockEnd);
        endDate.setDate(endDate.getDate() + 1);

        merged.push({
            title: currentTitle,
            start: blockStart,
            end: endDate.toISOString().split('T')[0],
            allDay: true,
            backgroundColor: currentColor,
            borderColor: currentColor,
            textColor: '#000000'
        });
    }

    for (let i = 1; i < events.length; i++) {
        const prev = new Date(blockEnd);
        const next = new Date(events[i].start as string);
        const diff = (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

        if (events[i].title === currentTitle && diff === 1) {
            blockEnd = events[i].start as string;
        } else {
            pushBlock();
            blockStart = events[i].start as string;
            blockEnd = events[i].start as string;
            currentTitle = events[i].title;
            currentColor = events[i].backgroundColor as string;
        }
    }

    pushBlock();
    return merged;
}
