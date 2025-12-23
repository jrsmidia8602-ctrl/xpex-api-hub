import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupRequest {
  backup_type: 'webhooks' | 'notification_preferences' | 'full';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { backup_type = 'full' }: BackupRequest = await req.json().catch(() => ({ backup_type: 'full' }));
    
    console.log(`Creating ${backup_type} backup for user ${user.id}`);

    const backupData: Record<string, unknown> = {};

    // Backup webhooks
    if (backup_type === 'webhooks' || backup_type === 'full') {
      const { data: webhooks, error: webhooksError } = await supabase
        .from('webhooks')
        .select('name, url, secret, events, active')
        .eq('user_id', user.id);

      if (webhooksError) {
        console.error('Error fetching webhooks:', webhooksError);
        throw new Error('Failed to fetch webhooks');
      }

      backupData.webhooks = webhooks || [];
      console.log(`Backed up ${webhooks?.length || 0} webhooks`);
    }

    // Backup notification preferences
    if (backup_type === 'notification_preferences' || backup_type === 'full') {
      const { data: preferences, error: preferencesError } = await supabase
        .from('notification_preferences')
        .select('email_enabled, push_enabled, in_app_enabled, webhook_failures, usage_alerts, weekly_reports')
        .eq('user_id', user.id)
        .single();

      if (preferencesError && preferencesError.code !== 'PGRST116') {
        console.error('Error fetching notification preferences:', preferencesError);
        throw new Error('Failed to fetch notification preferences');
      }

      backupData.notification_preferences = preferences || null;
      console.log('Backed up notification preferences');
    }

    // Store backup
    const { data: backup, error: backupError } = await supabase
      .from('configuration_backups')
      .insert({
        user_id: user.id,
        backup_type,
        data: backupData,
      })
      .select()
      .single();

    if (backupError) {
      console.error('Error creating backup:', backupError);
      throw new Error('Failed to create backup');
    }

    console.log(`Backup created successfully: ${backup.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        backup_id: backup.id,
        backup_type,
        created_at: backup.created_at,
        expires_at: backup.expires_at
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Backup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
