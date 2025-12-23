import { useState } from 'react';
import { useEmailTemplates, DEFAULT_TEMPLATES, EmailTemplate } from '@/hooks/useEmailTemplates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Mail, Plus, Trash2, Star, Edit, FileText, Bell, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TEMPLATE_TYPES = [
  { value: 'notification', label: 'Notificação', icon: Bell },
  { value: 'weekly_report', label: 'Relatório Semanal', icon: BarChart3 },
  { value: 'alert', label: 'Alerta', icon: FileText },
];

export const EmailTemplatesManager = () => {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate, setDefaultTemplate } = useEmailTemplates();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    template_type: 'notification' as EmailTemplate['template_type'],
    subject: '',
    html_content: '',
    variables: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      template_type: 'notification',
      subject: '',
      html_content: '',
      variables: '',
    });
    setEditingTemplate(null);
  };

  const loadDefaultTemplate = (type: EmailTemplate['template_type']) => {
    const defaultTemplate = DEFAULT_TEMPLATES[type];
    if (defaultTemplate) {
      setFormData({
        name: defaultTemplate.name,
        template_type: type,
        subject: defaultTemplate.subject,
        html_content: defaultTemplate.html_content,
        variables: defaultTemplate.variables.join(', '),
      });
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.subject || !formData.html_content) return;
    
    const variables = formData.variables.split(',').map(v => v.trim()).filter(Boolean);
    await createTemplate(
      formData.name,
      formData.template_type,
      formData.subject,
      formData.html_content,
      variables
    );
    setIsCreating(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingTemplate) return;
    
    const variables = formData.variables.split(',').map(v => v.trim()).filter(Boolean);
    await updateTemplate(editingTemplate.id, {
      name: formData.name,
      subject: formData.subject,
      html_content: formData.html_content,
      variables,
    });
    setEditingTemplate(null);
    resetForm();
  };

  const startEditing = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      template_type: template.template_type,
      subject: template.subject,
      html_content: template.html_content,
      variables: template.variables.join(', '),
    });
  };

  const getTypeIcon = (type: string) => {
    const typeInfo = TEMPLATE_TYPES.find(t => t.value === type);
    return typeInfo?.icon || FileText;
  };

  const getTypeLabel = (type: string) => {
    const typeInfo = TEMPLATE_TYPES.find(t => t.value === type);
    return typeInfo?.label || type;
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>Templates de Email</CardTitle>
          </div>
          <Dialog open={isCreating || !!editingTemplate} onOpenChange={(open) => {
            if (!open) {
              setIsCreating(false);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Editar Template' : 'Criar Novo Template'}</DialogTitle>
                <DialogDescription>
                  {editingTemplate 
                    ? 'Edite o template de email personalizado' 
                    : 'Crie um template de email personalizado para notificações e relatórios'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {!editingTemplate && (
                  <div className="space-y-2">
                    <Label>Tipo de Template</Label>
                    <Select
                      value={formData.template_type}
                      onValueChange={(value: EmailTemplate['template_type']) => {
                        setFormData(prev => ({ ...prev, template_type: value }));
                        loadDefaultTemplate(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => loadDefaultTemplate(formData.template_type)}>
                      Carregar Template Padrão
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Template</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Notificação de Erro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto do Email</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Ex: 🔔 {{title}}"
                  />
                  <p className="text-xs text-muted-foreground">Use {"{{variável}}"} para inserir dados dinâmicos</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variables">Variáveis Disponíveis</Label>
                  <Input
                    id="variables"
                    value={formData.variables}
                    onChange={(e) => setFormData(prev => ({ ...prev, variables: e.target.value }))}
                    placeholder="title, message, action_url"
                  />
                  <p className="text-xs text-muted-foreground">Separadas por vírgula</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="html_content">Conteúdo HTML</Label>
                  <Textarea
                    id="html_content"
                    value={formData.html_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                    placeholder="<html>...</html>"
                    className="font-mono text-sm min-h-[300px]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreating(false);
                    resetForm();
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={editingTemplate ? handleUpdate : handleCreate}>
                    {editingTemplate ? 'Salvar Alterações' : 'Criar Template'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Personalize os templates de email para notificações e relatórios
        </CardDescription>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum template criado ainda</p>
            <p className="text-sm">Crie seu primeiro template personalizado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => {
              const TypeIcon = getTypeIcon(template.template_type);
              return (
                <div 
                  key={template.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <TypeIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{template.name}</p>
                        {template.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Padrão
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{getTypeLabel(template.template_type)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Criado em {format(new Date(template.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!template.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefaultTemplate(template.id, template.template_type)}
                        title="Definir como padrão"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deletar Template</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar o template "{template.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTemplate(template.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
