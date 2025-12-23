import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  template_type: 'notification' | 'weekly_report' | 'alert';
  subject: string;
  html_content: string;
  variables: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_TEMPLATES = {
  notification: {
    name: 'Notificação Padrão',
    subject: '🔔 {{title}}',
    html_content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background: #f9fafb; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px;">
    <h2 style="color: #1f2937;">{{title}}</h2>
    <p style="color: #6b7280;">{{message}}</p>
    <a href="{{action_url}}" style="display: inline-block; background: #3b82f6; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 16px;">Ver Detalhes</a>
  </div>
</body>
</html>`,
    variables: ['title', 'message', 'action_url'],
  },
  weekly_report: {
    name: 'Relatório Semanal',
    subject: '📊 Relatório Semanal - {{period}}',
    html_content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background: #f9fafb; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0;">📊 Relatório Semanal</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">{{period}}</p>
    </div>
    <div style="padding: 24px;">
      <p>Olá, {{user_name}}!</p>
      <p>Aqui está o resumo da sua semana:</p>
      <div style="display: flex; gap: 12px; margin: 20px 0;">
        <div style="flex: 1; background: #f0fdf4; padding: 16px; border-radius: 8px; text-align: center;">
          <p style="font-size: 24px; font-weight: bold; color: #16a34a; margin: 0;">{{total_sent}}</p>
          <p style="color: #15803d; margin: 4px 0 0; font-size: 12px;">Enviados</p>
        </div>
        <div style="flex: 1; background: #f0fdf4; padding: 16px; border-radius: 8px; text-align: center;">
          <p style="font-size: 24px; font-weight: bold; color: #16a34a; margin: 0;">{{success_rate}}%</p>
          <p style="color: #15803d; margin: 4px 0 0; font-size: 12px;">Sucesso</p>
        </div>
      </div>
      {{#if has_errors}}
      <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px;">
        <p style="color: #dc2626; margin: 0;">⚠️ {{failed}} falhas detectadas</p>
      </div>
      {{/if}}
    </div>
  </div>
</body>
</html>`,
    variables: ['period', 'user_name', 'total_sent', 'success_rate', 'failed', 'has_errors'],
  },
  alert: {
    name: 'Alerta de Performance',
    subject: '⚠️ Alerta: {{alert_type}}',
    html_content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background: #f9fafb; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border-left: 4px solid #ef4444;">
    <h2 style="color: #dc2626; margin: 0 0 16px;">⚠️ {{alert_type}}</h2>
    <p style="color: #6b7280;">{{alert_message}}</p>
    <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0;"><strong>Valor Atual:</strong> {{current_value}}</p>
      <p style="margin: 8px 0 0;"><strong>Limite Configurado:</strong> {{threshold_value}}</p>
    </div>
    <a href="{{dashboard_url}}" style="display: inline-block; background: #ef4444; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Ver Dashboard</a>
  </div>
</body>
</html>`,
    variables: ['alert_type', 'alert_message', 'current_value', 'threshold_value', 'dashboard_url'],
  },
};

export const useEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTemplates = useCallback(async () => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching email templates:', error);
        return;
      }

      setTemplates((data || []) as unknown as EmailTemplate[]);
    } catch (error) {
      console.error('Error in fetchTemplates:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createTemplate = async (
    name: string,
    templateType: EmailTemplate['template_type'],
    subject: string,
    htmlContent: string,
    variables: string[] = []
  ) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          user_id: user.id,
          name,
          template_type: templateType,
          subject,
          html_content: htmlContent,
          variables,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        toast.error('Erro ao criar template');
        return null;
      }

      toast.success('Template criado com sucesso!');
      await fetchTemplates();
      return data as unknown as EmailTemplate;
    } catch (error) {
      console.error('Error in createTemplate:', error);
      toast.error('Erro ao criar template');
      return null;
    }
  };

  const updateTemplate = async (
    id: string,
    updates: Partial<Pick<EmailTemplate, 'name' | 'subject' | 'html_content' | 'variables' | 'is_default'>>
  ) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating template:', error);
        toast.error('Erro ao atualizar template');
        return false;
      }

      toast.success('Template atualizado!');
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      toast.error('Erro ao atualizar template');
      return false;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting template:', error);
        toast.error('Erro ao deletar template');
        return false;
      }

      toast.success('Template deletado!');
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      toast.error('Erro ao deletar template');
      return false;
    }
  };

  const setDefaultTemplate = async (id: string, templateType: EmailTemplate['template_type']) => {
    try {
      // Remove default from other templates of same type
      await supabase
        .from('email_templates')
        .update({ is_default: false })
        .eq('template_type', templateType);

      // Set this one as default
      const { error } = await supabase
        .from('email_templates')
        .update({ is_default: true })
        .eq('id', id);

      if (error) {
        console.error('Error setting default template:', error);
        toast.error('Erro ao definir template padrão');
        return false;
      }

      toast.success('Template definido como padrão!');
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error in setDefaultTemplate:', error);
      toast.error('Erro ao definir template padrão');
      return false;
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    refetch: fetchTemplates,
  };
};
