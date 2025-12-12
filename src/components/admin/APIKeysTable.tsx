import { useState } from "react";
import { Copy, Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface APIKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  calls: number;
  status: "active" | "inactive";
}

const initialKeys: APIKey[] = [
  {
    id: "1",
    name: "Production",
    key: "xpex_prod_k8s7d6f5g4h3j2k1",
    created: "2024-01-15",
    lastUsed: "2024-12-12",
    calls: 45230,
    status: "active",
  },
  {
    id: "2",
    name: "Development",
    key: "xpex_dev_m9n8b7v6c5x4z3a2",
    created: "2024-03-20",
    lastUsed: "2024-12-11",
    calls: 12450,
    status: "active",
  },
  {
    id: "3",
    name: "Testing",
    key: "xpex_test_p0o9i8u7y6t5r4e3",
    created: "2024-06-10",
    lastUsed: "2024-11-30",
    calls: 3200,
    status: "inactive",
  },
];

export const APIKeysTable = () => {
  const [keys, setKeys] = useState<APIKey[]>(initialKeys);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API Key copiada!");
  };

  const deleteKey = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id));
    toast.success("API Key removida");
  };

  const generateKey = () => {
    const newKey: APIKey = {
      id: Date.now().toString(),
      name: `New Key ${keys.length + 1}`,
      key: `xpex_${Math.random().toString(36).substring(2, 20)}`,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "-",
      calls: 0,
      status: "active",
    };
    setKeys([...keys, newKey]);
    toast.success("Nova API Key gerada!");
  };

  const maskKey = (key: string) => {
    return key.substring(0, 10) + "••••••••••••";
  };

  return (
    <div className="glass-card p-6 rounded-xl border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-semibold text-foreground">
          API Keys
        </h3>
        <Button variant="neon" size="sm" onClick={generateKey}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Key
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-mono text-xs">NOME</TableHead>
              <TableHead className="text-muted-foreground font-mono text-xs">KEY</TableHead>
              <TableHead className="text-muted-foreground font-mono text-xs">CRIADA</TableHead>
              <TableHead className="text-muted-foreground font-mono text-xs">ÚLTIMO USO</TableHead>
              <TableHead className="text-muted-foreground font-mono text-xs">CHAMADAS</TableHead>
              <TableHead className="text-muted-foreground font-mono text-xs">STATUS</TableHead>
              <TableHead className="text-muted-foreground font-mono text-xs">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((apiKey) => (
              <TableRow key={apiKey.id} className="border-border/30 hover:bg-muted/20">
                <TableCell className="font-medium text-foreground">{apiKey.name}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{apiKey.created}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{apiKey.lastUsed}</TableCell>
                <TableCell className="text-foreground font-mono">
                  {apiKey.calls.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={apiKey.status === "active" ? "default" : "secondary"}
                    className={
                      apiKey.status === "active"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {apiKey.status === "active" ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-neon-cyan"
                      onClick={() => copyKey(apiKey.key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-400"
                      onClick={() => deleteKey(apiKey.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
