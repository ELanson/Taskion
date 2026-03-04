import { supabase } from './supabase';
import { WorkspaceSettings } from '../store/useAppStore';

// Helper to convert snakes_case DB row to camelCase frontend object
const mapDatabaseToFrontend = (row: any): WorkspaceSettings => ({
    name: row.name,
    description: row.description || '',
    industry: row.industry || '',
    timezone: row.timezone,
    workingHoursStart: row.working_hours_start,
    workingHoursEnd: row.working_hours_end,
    currency: row.currency,
    defaultTaskStatus: row.default_task_status,
    defaultTaskPriority: row.default_task_priority,
    defaultDueDateOffsetDays: row.default_due_date_offset_days,
    tasksVisibleTo: row.tasks_visible_to,
    aiAccess: row.ai_access,
    aiDataScope: row.ai_data_scope,
    aiAutoExecute: row.ai_auto_execute,
    aiAutoCreateSubtasks: row.ai_auto_create_subtasks,
    aiUsageDailyCap: row.ai_usage_daily_cap,
    aiSystemPrompt: row.ai_system_prompt || '',
    notifyOverdueDays: row.notify_overdue_days,
    quietHoursEnabled: row.quiet_hours_enabled,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
    weekendNotifications: row.weekend_notifications,
    require2FA: row.require_2fa,
    enforceSSO: row.enforce_sso,
    sessionTimeoutMinutes: row.session_timeout_minutes,
    allowExternalCollaborators: row.allow_external_collaborators,
    allowPublicLinks: row.allow_public_links,
    defaultReportPeriod: row.default_report_period,
    autoWeeklySummary: row.auto_weekly_summary,
    dataRetentionDays: row.data_retention_days,
    slackConnected: row.slack_connected,
    googleCalendarConnected: row.google_calendar_connected,
    customWebhookUrl: row.custom_webhook_url || '',
    planTier: row.plan_tier,
    cloudAiEnabled: row.cloud_ai_enabled ?? false,
    cloudAiModel: row.cloud_ai_model || 'gemini-2.5-pro',
});

// Helper to convert camelCase frontend object to snake_case DB row
const mapFrontendToDatabase = (settings: Partial<WorkspaceSettings>) => {
    const row: any = {};
    if (settings.name !== undefined) row.name = settings.name;
    if (settings.description !== undefined) row.description = settings.description;
    if (settings.industry !== undefined) row.industry = settings.industry;
    if (settings.timezone !== undefined) row.timezone = settings.timezone;
    if (settings.workingHoursStart !== undefined) row.working_hours_start = settings.workingHoursStart;
    if (settings.workingHoursEnd !== undefined) row.working_hours_end = settings.workingHoursEnd;
    if (settings.currency !== undefined) row.currency = settings.currency;
    if (settings.defaultTaskStatus !== undefined) row.default_task_status = settings.defaultTaskStatus;
    if (settings.defaultTaskPriority !== undefined) row.default_task_priority = settings.defaultTaskPriority;
    if (settings.defaultDueDateOffsetDays !== undefined) row.default_due_date_offset_days = settings.defaultDueDateOffsetDays;
    if (settings.tasksVisibleTo !== undefined) row.tasks_visible_to = settings.tasksVisibleTo;
    if (settings.aiAccess !== undefined) row.ai_access = settings.aiAccess;
    if (settings.aiDataScope !== undefined) row.ai_data_scope = settings.aiDataScope;
    if (settings.aiAutoExecute !== undefined) row.ai_auto_execute = settings.aiAutoExecute;
    if (settings.aiAutoCreateSubtasks !== undefined) row.ai_auto_create_subtasks = settings.aiAutoCreateSubtasks;
    if (settings.aiUsageDailyCap !== undefined) row.ai_usage_daily_cap = settings.aiUsageDailyCap;
    if (settings.aiSystemPrompt !== undefined) row.ai_system_prompt = settings.aiSystemPrompt;
    if (settings.notifyOverdueDays !== undefined) row.notify_overdue_days = settings.notifyOverdueDays;
    if (settings.quietHoursEnabled !== undefined) row.quiet_hours_enabled = settings.quietHoursEnabled;
    if (settings.quietHoursStart !== undefined) row.quiet_hours_start = settings.quietHoursStart;
    if (settings.quietHoursEnd !== undefined) row.quiet_hours_end = settings.quietHoursEnd;
    if (settings.weekendNotifications !== undefined) row.weekend_notifications = settings.weekendNotifications;
    if (settings.require2FA !== undefined) row.require_2fa = settings.require2FA;
    if (settings.enforceSSO !== undefined) row.enforce_sso = settings.enforceSSO;
    if (settings.sessionTimeoutMinutes !== undefined) row.session_timeout_minutes = settings.sessionTimeoutMinutes;
    if (settings.allowExternalCollaborators !== undefined) row.allow_external_collaborators = settings.allowExternalCollaborators;
    if (settings.allowPublicLinks !== undefined) row.allow_public_links = settings.allowPublicLinks;
    if (settings.defaultReportPeriod !== undefined) row.default_report_period = settings.defaultReportPeriod;
    if (settings.autoWeeklySummary !== undefined) row.auto_weekly_summary = settings.autoWeeklySummary;
    if (settings.dataRetentionDays !== undefined) row.data_retention_days = settings.dataRetentionDays;
    if (settings.slackConnected !== undefined) row.slack_connected = settings.slackConnected;
    if (settings.googleCalendarConnected !== undefined) row.google_calendar_connected = settings.googleCalendarConnected;
    if (settings.customWebhookUrl !== undefined) row.custom_webhook_url = settings.customWebhookUrl;
    if (settings.planTier !== undefined) row.plan_tier = settings.planTier;
    if (settings.cloudAiEnabled !== undefined) row.cloud_ai_enabled = settings.cloudAiEnabled;
    if (settings.cloudAiModel !== undefined) row.cloud_ai_model = settings.cloudAiModel;

    // We update the timestamp whenever we save
    row.updated_at = new Date().toISOString();

    return row;
};

export const fetchWorkspaceSettings = async (): Promise<WorkspaceSettings | null> => {
    try {
        const { data, error } = await supabase
            .from('workspace_settings')
            .select('*')
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Table is empty or no data returned (PGRST116 is 'Results contain 0 rows')
                return null;
            }
            console.error('Error fetching workspace settings:', error);
            return null;
        }

        if (data) {
            return mapDatabaseToFrontend(data);
        }
        return null;
    } catch (error) {
        console.error('Error fetching workspace settings:', error);
        return null;
    }
};

export const updateWorkspaceSettingsInDB = async (updates: Partial<WorkspaceSettings>): Promise<boolean> => {
    try {
        const rowUpdates = mapFrontendToDatabase(updates);

        // Since it's a singleton, we try to update the first row
        // Without an ID, we could just pass a condition that's always true, e.g., name IS NOT NULL
        const { error } = await supabase
            .from('workspace_settings')
            .update(rowUpdates)
            .not('name', 'is', null);

        if (error) {
            console.error('Error updating workspace settings:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error updating workspace settings:', error);
        return false;
    }
};
