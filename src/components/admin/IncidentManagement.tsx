import { useState, useEffect } from "react";
import { AlertTriangle, Plus, Edit, CheckCircle2, Trash2, X, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  affected_services: string[];
  started_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

const SERVICES = [
  { id: 'database', label: 'Banco de Dados' },
  { id: 'authentication', label: 'Autenticação' },
  { id: 'edge_functions', label: 'Funções Backend' },
  { id: 'stripe', label: 'Pagamentos' },
  { id: 'email_service', label: 'Email' },
];

const STATUS_LABELS: Record<string, string> = {
  investigating: 'Investigando',
  identified: 'Identificado',
  monitoring: 'Monitorando',
  resolved: 'Resolvido',
};

const SEVERITY_LABELS: Record<string, string> = {
  minor: 'Menor',
  major: 'Maior',
  critical: 'Crítico',
};

const IncidentManagement = () => {
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'investigating' as Incident['status'],
    severity: 'minor' as Incident['severity'],
    affected_services: [] as string[],
  });

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('system_incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents((data as Incident[]) || []);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      toast.error('Erro ao carregar incidentes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (incident?: Incident) => {
    if (incident) {
      setEditingIncident(incident);
      setFormData({
        title: incident.title,
        description: incident.description,
        status: incident.status,
        severity: incident.severity,
        affected_services: incident.affected_services,
      });
    } else {
      setEditingIncident(null);
      setFormData({
        title: '',
        description: '',
        status: 'investigating',
        severity: 'minor',
        affected_services: [],
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    try {
      if (editingIncident) {
        const updateData: Record<string, unknown> = {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          severity: formData.severity,
          affected_services: formData.affected_services,
          updated_at: new Date().toISOString(),
        };

        if (formData.status === 'resolved' && !editingIncident.resolved_at) {
          updateData.resolved_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from('system_incidents')
          .update(updateData)
          .eq('id', editingIncident.id);

        if (error) throw error;
        toast.success('Incidente atualizado');
      } else {
        const { error } = await supabase
          .from('system_incidents')
          .insert({
            title: formData.title,
            description: formData.description,
            status: formData.status,
            severity: formData.severity,
            affected_services: formData.affected_services,
            started_at: new Date().toISOString(),
          });

        if (error) throw error;
        toast.success('Incidente criado');
      }

      setDialogOpen(false);
      fetchIncidents();
    } catch (err) {
      console.error('Error saving incident:', err);
      toast.error('Erro ao salvar incidente');
    }
  };

  const handleResolve = async (incident: Incident) => {
    try {
      const { error } = await supabase
        .from('system_incidents')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', incident.id);

      if (error) throw error;
      toast.success('Incidente resolvido');
      fetchIncidents();
    } catch (err) {
      console.error('Error resolving incident:', err);
      toast.error('Erro ao resolver incidente');
    }
  };

  const handleDelete = async (incidentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este incidente?')) return;

    try {
      const { error } = await supabase
        .from('system_incidents')
        .delete()
        .eq('id', incidentId);

      if (error) throw error;
      toast.success('Incidente excluído');
      fetchIncidents();
    } catch (err) {
      console.error('Error deleting incident:', err);
      toast.error('Erro ao excluir incidente');
    }
  };

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      affected_services: prev.affected_services.includes(serviceId)
        ? prev.affected_services.filter(s => s !== serviceId)
        : [...prev.affected_services, serviceId],
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'major': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'monitoring': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'identified': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
  };

  if (adminLoading || loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          Carregando...
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Gerenciar Incidentes
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Incidente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingIncident ? 'Editar Incidente' : 'Novo Incidente'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título do incidente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o incidente..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Incident['status'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investigating">Investigando</SelectItem>
                      <SelectItem value="identified">Identificado</SelectItem>
                      <SelectItem value="monitoring">Monitorando</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Severidade</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value as Incident['severity'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Menor</SelectItem>
                      <SelectItem value="major">Maior</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Serviços Afetados</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICES.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={formData.affected_services.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <label
                        htmlFor={service.id}
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        {service.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingIncident ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum incidente registrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-medium text-foreground truncate">
                        {incident.title}
                      </h4>
                      <Badge className={getSeverityColor(incident.severity)}>
                        {SEVERITY_LABELS[incident.severity]}
                      </Badge>
                      <Badge className={getStatusColor(incident.status)}>
                        {STATUS_LABELS[incident.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {incident.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(incident.started_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                      {incident.affected_services.length > 0 && (
                        <span>
                          {incident.affected_services.length} serviço(s) afetado(s)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {incident.status !== 'resolved' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResolve(incident)}
                        className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(incident)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(incident.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { IncidentManagement };
