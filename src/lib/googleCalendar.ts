import { Appointment, Task } from '../store/useAppStore';

/**
 * Utility to handle Google Calendar synchronization and iCal export.
 */

export interface GCalEvent {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    location?: string;
}

/**
 * Converts internal Appointment/Task to Google Calendar Event format
 */
export function convertToGCalEvent(item: Appointment | Task): GCalEvent {
    if ('start_time' in item) {
        // It's an Appointment
        return {
            summary: item.title,
            description: item.description,
            location: item.location,
            start: { dateTime: item.start_time },
            end: { dateTime: item.end_time }
        };
    } else {
        // It's a Task
        const start = item.start_date ? new Date(item.start_date).toISOString() : new Date().toISOString();
        const end = item.due_date ? new Date(item.due_date).toISOString() : new Date(Date.now() + 3600000).toISOString();
        return {
            summary: `[Task] ${item.title}`,
            description: item.description,
            start: { dateTime: start },
            end: { dateTime: end }
        };
    }
}

/**
 * Generates an iCal (.ics) string for a list of appointments and tasks.
 * Useful for one-way sync/import to external calendars.
 */
export function generateICal(items: (Appointment | Task)[]): string {
    let ical = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Rickel Industries//Tickel//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];

    items.forEach(item => {
        const isApp = 'start_time' in item;
        const start = isApp ? item.start_time : (item.start_date || new Date().toISOString());
        const end = isApp ? item.end_time : (item.due_date || new Date(Date.now() + 3600000).toISOString());

        const format = (dateStr: string) => dateStr.replace(/[-:]/g, '').split('.')[0] + 'Z';

        ical.push('BEGIN:VEVENT');
        ical.push(`UID:${item.id}@tickel.rickelindustries.co.ke`);
        ical.push(`DTSTAMP:${format(new Date().toISOString())}`);
        ical.push(`DTSTART:${format(start)}`);
        ical.push(`DTEND:${format(end)}`);
        ical.push(`SUMMARY:${isApp ? '' : '[Task] '}${item.title}`);
        if (item.description) ical.push(`DESCRIPTION:${item.description.replace(/\n/g, '\\n')}`);
        if ('location' in item && item.location) ical.push(`LOCATION:${item.location}`);
        ical.push('END:VEVENT');
    });

    ical.push('END:VCALENDAR');
    return ical.join('\r\n');
}

/**
 * Downloads the calendar as an .ics file
 */
export function downloadCalendarICS(items: (Appointment | Task)[], filename = 'tickel-planner.ics') {
    const content = generateICal(items);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Placeholder for full Google Calendar API OAuth flow.
 * Requires VITE_GOOGLE_CLIENT_ID and proper redirect URIs.
 */
export async function syncToGoogleCalendar(events: GCalEvent[]) {
    // Implementation would involve:
    // 1. gapi.client.init with credentials
    // 2. gapi.auth2.getAuthInstance().signIn()
    // 3. gapi.client.calendar.events.insert()
    return { success: true, message: "Foundation ready. Connect Google Cloud Project to enable live sync." };
}
