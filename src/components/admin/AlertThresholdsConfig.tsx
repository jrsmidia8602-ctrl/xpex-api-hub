import { useState } from 'react';
import { useAlertThresholds } from '@/hooks/useAlertThresholds';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Clock, AlertTriangle, Save } from 'lucide-react';

export const AlertThresholdsConfig = () => {
  const { thresholds, loading, updateThresholds } = useAlertThresholds();
  const [latencyMs, setLatencyMs] = useState<number>(1000);
  const [errorRate, setErrorRate] = useState<number>(5);
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sync local state when thresholds load
  if (thresholds && latencyMs === 1000 && errorRate === 5) {
    setLatencyMs(thresholds.latency_threshold_ms);
    setErrorRate(thresholds.error_rate_threshold);
    setEnabled(thresholds.enabled);
  }

  const handleSave = async () => {
    setSaving(true);
    await updateThresholds({
      latency_threshold_ms: latencyMs,
      error_rate_threshold: errorRate,
      enabled,
    });
    setSaving(false);
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>Configurar Alertas Automáticos</CardTitle>
        </div>
        <CardDescription>
          Configure limites para receber alertas quando a performance ultrapassar os valores definidos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-foreground">Alertas Ativados</p>
              <p className="text-sm text-muted-foreground">Receber notificações quando limites forem atingidos</p>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="latency" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Limite de Latência (ms)
            </Label>
            <Input
              id="latency"
              type="number"
              min={100}
              max={10000}
              value={latencyMs}
              onChange={(e) => setLatencyMs(Number(e.target.value))}
              disabled={!enabled}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Alertar quando latência média ultrapassar este valor
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="errorRate" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Taxa de Erro Máxima (%)
            </Label>
            <Input
              id="errorRate"
              type="number"
              min={1}
              max={100}
              step={0.5}
              value={errorRate}
              onChange={(e) => setErrorRate(Number(e.target.value))}
              disabled={!enabled}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Alertar quando taxa de erro ultrapassar este percentual
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
