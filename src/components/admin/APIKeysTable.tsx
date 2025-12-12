import { useState } from "react";
import { Copy, Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAPIKeys } from "@/hooks/useAPIKeys";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const APIKeysTable = () => {
  const { keys, loading, generateKey, deleteKey } = useAPIKeys();
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newKeyName, setNewKeyName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Digite um nome para a key");
      return;
    }
    setIsCreating(true);
    await generateKey(newKeyName);
    setNewKeyName("");
    setIsDialogOpen(false);
    setIsCreating(false);
  };

  const maskKey = (key: string) => {
    return key.substring(0, 12) + "••••••••••••";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-xl border border-border/50">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted/50 rounded w-1/4" />
          <div className="h-32 bg-muted/50 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-xl border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-semibold text-foreground">
          API Keys
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="neon" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Key
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/50">
            <DialogHeader>
              <DialogTitle className="text-foreground">Criar Nova API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Nome da key (ex: Production, Development)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="bg-background/50 border-border/50"
              />
              <Button 
                variant="neon" 
                className="w-full" 
                onClick={handleCreateKey}
                disabled={isCreating}
              >
                {isCreating ? "Criando..." : "Criar Key"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {keys.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Nenhuma API key encontrada</p>
          <Button variant="neon" size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar primeira key
          </Button>
        </div>
      ) : (
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
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(apiKey.created_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(apiKey.last_used_at)}
                  </TableCell>
                  <TableCell className="text-foreground font-mono">
                    {apiKey.calls_count.toLocaleString()}
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
      )}
    </div>
  );
};
