import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUsageLogs } from "@/hooks/useUsageLogs";
import { useAPIKeys } from "@/hooks/useAPIKeys";
import { useSubscription } from "@/hooks/useSubscription";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ReportType = "usage" | "validations" | "metrics" | "full";
type ExportFormat = "csv" | "pdf";

export function ExportReports() {
  const [reportType, setReportType] = useState<ReportType>("full");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { logs, stats } = useUsageLogs();
  const { keys } = useAPIKeys();
  const { subscription } = useSubscription();

  const generateCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          const stringValue = String(value ?? "");
          return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = (content: string, filename: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir a janela de impressão. Verifique se popups estão bloqueados.",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>XPEX Neural - Relatório</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #333; }
            h1 { color: #0891b2; border-bottom: 2px solid #0891b2; padding-bottom: 10px; }
            h2 { color: #1e293b; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background-color: #f8fafc; font-weight: 600; }
            .metric { display: inline-block; margin: 10px 20px 10px 0; }
            .metric-value { font-size: 24px; font-weight: bold; color: #0891b2; }
            .metric-label { font-size: 12px; color: #64748b; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>XPEX Neural - Relatório</h1>
          <p>Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
          ${content}
          <div class="footer">
            <p>Este relatório foi gerado automaticamente pelo XPEX Neural.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getUsageData = () => {
    return logs.map((log) => ({
      data: format(new Date(log.created_at), "dd/MM/yyyy HH:mm"),
      endpoint: log.endpoint,
      status: log.status_code,
      tempo_resposta_ms: log.response_time_ms || 0,
    }));
  };

  const getValidationsData = () => {
    return logs
      .filter((log) => log.endpoint.includes("validate"))
      .map((log) => ({
        data: format(new Date(log.created_at), "dd/MM/yyyy HH:mm"),
        endpoint: log.endpoint,
        sucesso: log.status_code >= 200 && log.status_code < 300 ? "Sim" : "Não",
        tempo_resposta_ms: log.response_time_ms || 0,
      }));
  };

  const getMetricsData = () => {
    return [
      { metrica: "Total de Chamadas", valor: stats?.totalCalls || 0 },
      { metrica: "Taxa de Sucesso", valor: `${stats?.successRate?.toFixed(1) || 0}%` },
      { metrica: "Tempo Médio de Resposta", valor: `${stats?.avgResponseTime?.toFixed(0) || 0}ms` },
      { metrica: "API Keys Ativas", valor: keys.filter((k) => k.status === "active").length },
      { metrica: "Plano Atual", valor: subscription.tier.toUpperCase() },
      { metrica: "Créditos Mensais", valor: subscription.monthlyCredits === -1 ? "Ilimitado" : subscription.monthlyCredits },
    ];
  };

  const generatePDFContent = () => {
    let content = "";

    if (reportType === "metrics" || reportType === "full") {
      const metrics = getMetricsData();
      content += `
        <h2>Métricas Gerais</h2>
        <div>
          ${metrics.map((m) => `<div class="metric"><div class="metric-value">${m.valor}</div><div class="metric-label">${m.metrica}</div></div>`).join("")}
        </div>
      `;
    }

    if (reportType === "usage" || reportType === "full") {
      const usage = getUsageData().slice(0, 50);
      content += `
        <h2>Histórico de Uso (últimas 50 chamadas)</h2>
        <table>
          <thead><tr><th>Data</th><th>Endpoint</th><th>Status</th><th>Tempo (ms)</th></tr></thead>
          <tbody>
            ${usage.map((u) => `<tr><td>${u.data}</td><td>${u.endpoint}</td><td>${u.status}</td><td>${u.tempo_resposta_ms}</td></tr>`).join("")}
          </tbody>
        </table>
      `;
    }

    if (reportType === "validations" || reportType === "full") {
      const validations = getValidationsData().slice(0, 50);
      content += `
        <h2>Validações (últimas 50)</h2>
        <table>
          <thead><tr><th>Data</th><th>Endpoint</th><th>Sucesso</th><th>Tempo (ms)</th></tr></thead>
          <tbody>
            ${validations.map((v) => `<tr><td>${v.data}</td><td>${v.endpoint}</td><td>${v.sucesso}</td><td>${v.tempo_resposta_ms}</td></tr>`).join("")}
          </tbody>
        </table>
      `;
    }

    return content;
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (exportFormat === "csv") {
        let data: Record<string, unknown>[] = [];
        let filename = "xpex_report";

        switch (reportType) {
          case "usage":
            data = getUsageData();
            filename = "xpex_uso";
            break;
          case "validations":
            data = getValidationsData();
            filename = "xpex_validacoes";
            break;
          case "metrics":
            data = getMetricsData();
            filename = "xpex_metricas";
            break;
          case "full":
            data = [
              ...getMetricsData().map((m) => ({ tipo: "Métrica", ...m })),
              ...getUsageData().map((u) => ({ tipo: "Uso", ...u })),
            ];
            filename = "xpex_relatorio_completo";
            break;
        }

        generateCSV(data, filename);
      } else {
        const content = generatePDFContent();
        generatePDF(content, `xpex_relatorio_${reportType}`);
      }

      toast({
        title: "Relatório exportado!",
        description: `Seu relatório foi gerado com sucesso em ${exportFormat.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="card-cyber">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="h-5 w-5 text-primary" />
          Exportar Relatórios
        </CardTitle>
        <CardDescription>
          Exporte dados de uso, validações e métricas do dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="report-type">Tipo de Relatório</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger id="report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Relatório Completo</SelectItem>
                <SelectItem value="usage">Histórico de Uso</SelectItem>
                <SelectItem value="validations">Validações</SelectItem>
                <SelectItem value="metrics">Métricas Gerais</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="export-format">Formato</Label>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
              <SelectTrigger id="export-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV (Excel)
                  </span>
                </SelectItem>
                <SelectItem value="pdf">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
          variant="neon"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportar {exportFormat.toUpperCase()}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
