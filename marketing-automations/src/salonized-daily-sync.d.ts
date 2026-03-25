export interface SalonizedDailySyncOptions {
  icalUrl: string;
  date?: string;
  dryRun?: boolean;
  reportPath?: string;
  mailchimpPageSize?: number;
  includeUnsubscribed?: boolean;
}

export interface SalonizedDailySyncReport {
  date: string;
  dryRun: boolean;
  totals: {
    todayAppointments: number;
    rawTodayAppointments?: number;
    updated: number;
    skippedOlderOrEqual: number;
    skippedNoMatch: number;
    skippedAmbiguous: number;
    errors: number;
  };
}

export function runSalonizedDailySync(
  options: SalonizedDailySyncOptions
): Promise<SalonizedDailySyncReport>;
