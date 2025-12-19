import { useState } from "react";
import { Play, Copy, Check, Code2, Terminal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface APIEndpoint {
  id: string;
  name: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  params: { name: string; type: string; required: boolean; description: string }[];
  exampleBody?: Record<string, unknown>;
}

const endpoints: APIEndpoint[] = [
  {
    id: "validate-email",
    name: "Validar Email",
    method: "POST",
    path: "/validate-email",
    description: "Valida um endereço de email verificando formato, domínio e deliverability.",
    params: [
      { name: "email", type: "string", required: true, description: "Endereço de email a validar" },
    ],
    exampleBody: { email: "teste@exemplo.com" },
  },
  {
    id: "validate-email-ai",
    name: "Validar Email (AI)",
    method: "POST",
    path: "/validate-email-ai",
    description: "Validação avançada de email usando inteligência artificial.",
    params: [
      { name: "email", type: "string", required: true, description: "Endereço de email a validar" },
    ],
    exampleBody: { email: "teste@exemplo.com" },
  },
  {
    id: "ai-insights",
    name: "AI Insights",
    method: "POST",
    path: "/ai-insights",
    description: "Obtém insights de IA sobre os dados de uso da sua conta.",
    params: [],
    exampleBody: {},
  },
];

function generateCodeExample(endpoint: APIEndpoint, params: Record<string, string>, apiKey: string): { curl: string; javascript: string; python: string } {
  const baseUrl = `https://bgfjhietjsrlzscxdutt.supabase.co/functions/v1${endpoint.path}`;
  const body = endpoint.exampleBody ? { ...endpoint.exampleBody, ...params } : params;
  const bodyStr = JSON.stringify(body, null, 2);

  const curl = `curl -X ${endpoint.method} \\
  "${baseUrl}" \\
  -H "x-api-key: ${apiKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(body)}'`;

  const javascript = `const response = await fetch("${baseUrl}", {
  method: "${endpoint.method}",
  headers: {
    "x-api-key": "${apiKey || 'YOUR_API_KEY'}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${bodyStr}),
});

const data = await response.json();
console.log(data);`;

  const python = `import requests

response = requests.${endpoint.method.toLowerCase()}(
    "${baseUrl}",
    headers={
        "x-api-key": "${apiKey || 'YOUR_API_KEY'}",
        "Content-Type": "application/json",
    },
    json=${bodyStr.replace(/"/g, "'").replace(/null/g, "None").replace(/true/g, "True").replace(/false/g, "False")},
)

print(response.json())`;

  return { curl, javascript, python };
}

export function APIPlayground() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>(endpoints[0].id);
  const [params, setParams] = useState<Record<string, string>>({});
  const [apiKey, setApiKey] = useState("");
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const endpoint = endpoints.find((e) => e.id === selectedEndpoint)!;
  const codeExamples = generateCodeExample(endpoint, params, apiKey);

  const handleCopy = async (code: string, type: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExecute = async () => {
    if (!apiKey) {
      toast({
        title: "API Key necessária",
        description: "Insira sua API Key para executar a requisição.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResponse("");

    try {
      const baseUrl = `https://bgfjhietjsrlzscxdutt.supabase.co/functions/v1${endpoint.path}`;
      const body = endpoint.exampleBody ? { ...endpoint.exampleBody, ...params } : params;

      const res = await fetch(baseUrl, {
        method: endpoint.method,
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));

      toast({
        title: res.ok ? "Sucesso!" : "Erro na requisição",
        description: res.ok ? "Requisição executada com sucesso." : `Status: ${res.status}`,
        variant: res.ok ? "default" : "destructive",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      setResponse(JSON.stringify({ error: errorMessage }, null, 2));
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="card-cyber">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Terminal className="h-5 w-5 text-primary" />
          API Playground
        </CardTitle>
        <CardDescription>Teste as APIs diretamente com exemplos de código</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Endpoint</Label>
            <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {endpoints.map((ep) => (
                  <SelectItem key={ep.id} value={ep.id}>
                    <span className="flex items-center gap-2">
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${ep.method === "GET" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
                        {ep.method}
                      </span>
                      {ep.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{endpoint.description}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Sua API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        </div>

        {endpoint.params.length > 0 && (
          <div className="space-y-3">
            <Label>Parâmetros</Label>
            {endpoint.params.map((param) => (
              <div key={param.name} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor={param.name} className="text-xs font-mono">
                    {param.name}
                    {param.required && <span className="text-destructive">*</span>}
                  </Label>
                  <span className="text-xs text-muted-foreground">({param.type})</span>
                </div>
                <Input
                  id={param.name}
                  placeholder={param.description}
                  value={params[param.name] || ""}
                  onChange={(e) => setParams((prev) => ({ ...prev, [param.name]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleExecute} disabled={isLoading} className="w-full" variant="neon">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Executar Requisição
            </>
          )}
        </Button>

        <Tabs defaultValue="curl" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
          </TabsList>
          {(["curl", "javascript", "python"] as const).map((lang) => (
            <TabsContent key={lang} value={lang} className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8"
                onClick={() => handleCopy(codeExamples[lang], lang)}
              >
                {copied === lang ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
              <ScrollArea className="h-[150px] w-full rounded-md border border-border/50 bg-muted/50 p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap">{codeExamples[lang]}</pre>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        {response && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Resposta
            </Label>
            <ScrollArea className="h-[200px] w-full rounded-md border border-border/50 bg-muted/50 p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap text-green-400">{response}</pre>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
