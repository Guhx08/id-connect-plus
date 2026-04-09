import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";

type Solicitation = {
  id: string;
  nome_solicitante: string;
  email: string;
  telefone: string | null;
  sector_id: string;
  descricao: string;
  status: string;
  resposta: string | null;
  created_at: string;
};

type Sector = { id: string; name: string };

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-300",
  em_andamento: "bg-blue-100 text-blue-800 border-blue-300",
  concluido: "bg-green-100 text-green-800 border-green-300",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
};

const Admin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [solicitations, setSolicitations] = useState<Solicitation[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [filterSector, setFilterSector] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("concluido");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    // Check if user is admin
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").then(({ data }) => {
      const admin = !!(data && data.length > 0);
      setIsAdmin(admin);
      setLoading(false);
    });
  }, [session]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("sectors").select("id, name").order("name").then(({ data }) => {
      if (data) setSectors(data);
    });
    fetchSolicitations();
  }, [isAdmin]);

  const fetchSolicitations = async () => {
    const { data } = await supabase
      .from("solicitations")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSolicitations(data);
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) {
      toast({ title: "Digite uma resposta.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("solicitations").update({
      resposta: replyText,
      status: replyStatus,
      responded_by: session!.user.id,
      responded_at: new Date().toISOString(),
    }).eq("id", id);
    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao responder.", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Resposta salva com sucesso!" });
      setReplyId(null);
      setReplyText("");
      fetchSolicitations();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <p className="text-foreground font-semibold">Acesso restrito. Faça login primeiro.</p>
            <Button onClick={() => navigate("/")}>Ir para Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <p className="text-foreground font-semibold">Você não tem permissão de administrador.</p>
            <Button variant="outline" onClick={handleLogout}>Sair</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sectorMap = Object.fromEntries(sectors.map((s) => [s.id, s.name]));
  const filtered = solicitations.filter((s) => {
    if (filterSector !== "all" && s.sector_id !== filterSector) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-xs text-muted-foreground">RSIM Consultoria · Gerenciamento de Solicitações</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{session.user.email}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>Sair</Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Setor</label>
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Setores</SelectItem>
                {sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSolicitations}>Atualizar</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Pendentes", count: solicitations.filter((s) => s.status === "pendente").length, color: "text-yellow-600" },
            { label: "Em Andamento", count: solicitations.filter((s) => s.status === "em_andamento").length, color: "text-blue-600" },
            { label: "Concluídas", count: solicitations.filter((s) => s.status === "concluido").length, color: "text-green-600" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Solicitations list */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhuma solicitação encontrada.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((sol) => (
              <Card key={sol.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-base">{sol.nome_solicitante}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {sol.email} {sol.telefone && `· ${sol.telefone}`} · {new Date(sol.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{sectorMap[sol.sector_id] || "—"}</Badge>
                      <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[sol.status] || "bg-muted text-muted-foreground"}`}>
                        {statusLabels[sol.status] || sol.status}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Descrição:</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{sol.descricao}</p>
                  </div>

                  {sol.resposta && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-green-700 mb-1">Resposta:</p>
                      <p className="text-sm text-green-900 whitespace-pre-wrap">{sol.resposta}</p>
                    </div>
                  )}

                  {replyId === sol.id ? (
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Digite a resposta / retorno..."
                        rows={3}
                      />
                      <div className="flex items-center gap-3">
                        <Select value={replyStatus} onValueChange={setReplyStatus}>
                          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="em_andamento">Em Andamento</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={() => handleReply(sol.id)} disabled={submitting}>
                          {submitting ? "Salvando..." : "Salvar Resposta"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setReplyId(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setReplyId(sol.id); setReplyText(sol.resposta || ""); setReplyStatus(sol.status === "pendente" ? "concluido" : sol.status); }}>
                      {sol.resposta ? "Editar Resposta" : "Responder"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
