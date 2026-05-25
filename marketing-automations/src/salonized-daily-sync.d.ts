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
    plannedUpdates?: number;
    skippedOlderOrEqual: number;
    skippedNoMatch: number;
    skippedAmbiguous: number;
    skippedUnknownTreatment: number;
    skippedFollowup: number;
    skippedTooRecent: number;
    aftercareSent: number;
    aftercareErrors: number;
    errors: number;
  };
  details?: {
    aftercareErrors?: Array<{ treatmentType: string; emails: string[]; error: string }>;
    aftercareSent?: Array<{ treatmentType: string; emails: string[]; campaignId?: string }>;
    errors?: Array<{ email: string; error: string }>;
  };
}

export interface JourneyEmailsOptions {
  dryRun?: boolean;
  mailchimpPageSize?: number;
}

export interface JourneyEmailsReport {
  totals: {
    checked: number;
    sent: number;
    skippedOverdue: number;
    skippedNoTemplate: number;
    errors: number;
  };
  details: {
    sent: Array<{ stage: string; treatmentType: string; emails: string[]; campaignId?: string }>;
    skipped: Array<{ stage?: string; treatmentType?: string; emails?: string[]; email?: string; reason: string }>;
    errors: Array<{ stage: string; treatmentType: string; emails: string[]; error: string }>;
  };
  error?: string;
}

export function runSalonizedDailySync(
  options: SalonizedDailySyncOptions
): Promise<SalonizedDailySyncReport>;

export function runJourneyEmails(
  options?: JourneyEmailsOptions
): Promise<JourneyEmailsReport>;
