import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { 
  FileText, 
  Key, 
  Mail, 
  Settings, 
  User, 
  Zap, 
  Search,
  Filter,
  RefreshCw,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

const getActionIcon = (action: string) => {
  if (action.includes('api_key')) return Key;
  if (action.includes('email') || action.includes('validation')) return Mail;
  if (action.includes('settings') || action.includes('config')) return Settings;
  if (action.includes('login') || action.includes('signup') || action.includes('auth')) return User;
  if (action.includes('webhook')) return Zap;
  return FileText;
};

const getActionColor = (action: string): string => {
  if (action.includes('create') || action.includes('add')) return 'bg-green-500/10 text-green-500';
  if (action.includes('delete') || action.includes('remove')) return 'bg-red-500/10 text-red-500';
  if (action.includes('update') || action.includes('edit')) return 'bg-blue-500/10 text-blue-500';
  if (action.includes('login') || action.includes('auth')) return 'bg-purple-500/10 text-purple-500';
  return 'bg-muted text-muted-foreground';
};

const formatAction = (action: string): string => {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

export const AuditLogsPanel = () => {
  const { logs, loading, refetch } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.resource_id?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || log.resource_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const resourceTypes = [...new Set(logs.map(log => log.resource_type))];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Logs de Auditoria
            </CardTitle>
            <CardDescription>
              Histórico completo de todas as ações realizadas na sua conta
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ação, recurso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {resourceTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{logs.length}</p>
            <p className="text-xs text-muted-foreground">Total de Logs</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{resourceTypes.length}</p>
            <p className="text-xs text-muted-foreground">Tipos de Recursos</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">
              {logs.filter(l => {
                const logDate = new Date(l.created_at);
                const today = new Date();
                return logDate.toDateString() === today.toDateString();
              }).length}
            </p>
            <p className="text-xs text-muted-foreground">Ações Hoje</p>
          </div>
        </div>

        {/* Logs List */}
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileText className="h-12 w-12 mb-2 opacity-50" />
              <p>Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const Icon = getActionIcon(log.action);
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{formatAction(log.action)}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.resource_type}
                        </Badge>
                      </div>
                      {log.resource_id && (
                        <p className="text-sm text-muted-foreground truncate">
                          ID: {log.resource_id}
                        </p>
                      )}
                      {log.details && typeof log.details === 'object' && Object.keys(log.details).length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(log.details).slice(0, 100)}...
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      {format(new Date(log.created_at), 'dd/MM HH:mm')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
