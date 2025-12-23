import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RestoreRequest {
  backup_id: string;
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

    const { backup_id }: RestoreRequest = await req.json();

    if (!backup_id) {
      return new Response(
        JSON.stringify({ error: 'backup_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Restoring backup ${backup_id} for user ${user.id}`);

    // Fetch the backup
    const { data: backup, error: backupError } = await supabase
      .from('configuration_backups')
      .select('*')
      .eq('id', backup_id)
      .eq('user_id', user.id)
      .single();

    if (backupError || !backup) {
      console.error('Backup not found:', backupError);
      return new Response(
        JSON.stringify({ error: 'Backup not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const restoredItems: string[] = [];

    // Restore webhooks
    if (backup.data.webhooks && backup.data.webhooks.length > 0) {
      // Delete existing webhooks
      await supabase
        .from('webhooks')
        .delete()
        .eq('user_id', user.id);

      // Insert backed up webhooks
      const webhooksToInsert = backup.data.webhooks.map((webhook: any) => ({
        ...webhook,
        user_id: user.id,
      }));

      const { error: insertError } = await supabase
        .from('webhooks')
        .insert(webhooksToInsert);

      if (insertError) {
        console.error('Error restoring webhooks:', insertError);
        throw new Error('Failed to restore webhooks');
      }

      restoredItems.push(`${backup.data.webhooks.length} webhooks`);
      console.log(`Restored ${backup.data.webhooks.length} webhooks`);
    }

    // Restore notification preferences
    if (backup.data.notification_preferences) {
      const { error: upsertError } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...backup.data.notification_preferences,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Error restoring notification preferences:', upsertError);
        throw new Error('Failed to restore notification preferences');
      }

      restoredItems.push('notification preferences');
      console.log('Restored notification preferences');
    }

    console.log(`Restore completed successfully for backup ${backup_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        restored: restoredItems,
        backup_type: backup.backup_type,
        backup_date: backup.created_at
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Restore error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
