import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useConfigurationBackups } from '@/hooks/useConfigurationBackups';
import { useAuth } from '@/hooks/useAuth';
import { 
  Download, 
  Upload, 
  Trash2, 
  Archive, 
  Bell, 
  Webhook,
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ConfigurationBackups() {
  const { backups, loading, createBackup, restoreBackup, deleteBackup } = useConfigurationBackups();
  const { user } = useAuth();
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [backupType, setBackupType] = useState<'full' | 'webhooks' | 'notification_preferences'>('full');

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Backups de Configuração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Faça login para gerenciar seus backups.</p>
        </CardContent>
      </Card>
    );
  }

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    await createBackup(backupType);
    setCreatingBackup(false);
  };

  const handleRestore = async (backupId: string) => {
    setRestoringId(backupId);
    await restoreBackup(backupId);
    setRestoringId(null);
  };

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'webhooks':
        return <Webhook className="h-4 w-4" />;
      case 'notification_preferences':
        return <Bell className="h-4 w-4" />;
      default:
        return <Archive className="h-4 w-4" />;
    }
  };

  const getBackupTypeLabel = (type: string) => {
    switch (type) {
      case 'webhooks':
        return 'Webhooks';
      case 'notification_preferences':
        return 'Preferências';
      default:
        return 'Completo';
    }
  };

  const getBackupSummary = (data: Record<string, unknown>) => {
    const items: string[] = [];
    if (data.webhooks && Array.isArray(data.webhooks)) {
      items.push(`${data.webhooks.length} webhooks`);
    }
    if (data.notification_preferences) {
      items.push('preferências de notificação');
    }
    return items.join(', ') || 'Vazio';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Backups de Configuração
            </CardTitle>
            <CardDescription>
              Faça backup e restaure suas configurações de webhook e notificações
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={backupType} onValueChange={(v) => setBackupType(v as typeof backupType)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Backup Completo</SelectItem>
                <SelectItem value="webhooks">Apenas Webhooks</SelectItem>
                <SelectItem value="notification_preferences">Apenas Preferências</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateBackup} disabled={creatingBackup}>
              <Download className="h-4 w-4 mr-2" />
              {creatingBackup ? 'Criando...' : 'Criar Backup'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8">
            <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum backup encontrado</p>
            <p className="text-sm text-muted-foreground">
              Crie um backup para proteger suas configurações
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    {getBackupTypeIcon(backup.backup_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getBackupTypeLabel(backup.backup_type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {getBackupSummary(backup.data)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(backup.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(backup.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                      {new Date(backup.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                        <span className="flex items-center gap-1 text-warning">
                          <AlertCircle className="h-3 w-3" />
                          Expira em breve
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={restoringId === backup.id}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        {restoringId === backup.id ? 'Restaurando...' : 'Restaurar'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Restaurar Backup</AlertDialogTitle>
                        <AlertDialogDescription>
                          Isso irá substituir suas configurações atuais pelas do backup.
                          Esta ação não pode ser desfeita. Deseja continuar?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRestore(backup.id)}>
                          Restaurar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Backup</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este backup? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteBackup(backup.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
