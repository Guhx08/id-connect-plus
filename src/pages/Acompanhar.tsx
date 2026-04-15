import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Search, ArrowLeft, Clock, CheckCircle, Loader2 } from "lucide-react";

type Solicitation = {
  id: string;
  nome_solicitante: string;
  email: string;
  telefone: string | null;
  sector_id: string;
  descricao: string;
  status: string;
  resposta: string | null;
  responded_at: string | null;
  created_at: string;
};

type Sector = { id: string; name: string };

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: <Clock className="w-4 h-4" /> },
  em_andamento: { label: "Em Andamento", color: "bg-blue-100 text-blue-800 border-blue-300", icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  concluido: { label: "Concluído", color: "bg-green-100 text-green-800 border-green-300", icon: <CheckCircle className="w-4 h-4" /> },
};

const Acompanhar = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [solicitations, setSolicitations] = useState<Solicitation[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);

  const handleSearch = async () => {
    if (!email.trim()) {
      toast({ title: "Digite seu e-mail para consultar.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setSearched(true);

    const [lookupRes, { data: secs }] = await Promise.all([
      supabase.functions.invoke("lookup-solicitations", {
        body: { email: email.trim().toLowerCase() },
      }),
      supabase.from("sectors").select("id, name"),
    ]);
    const sols = lookupRes?.data?.data || [];

    setSolicitations(sols || []);
    setSectors(secs || []);
    setLoading(false);
  };

  const sectorMap = Object.fromEntries(sectors.map((s) => [s.id, s.name]));

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-background flex flex-col">
      <header className="bg-card border-b px-6 py-4 flex items-center gap-4 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Acompanhar Solicitação</h1>
          <p className="text-xs text-muted-foreground">RSIM Consultoria · Consulte o status do seu chamado</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <Card className="w-full max-w-xl mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-5 h-5" /> Consultar pelo e-mail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
              className="flex gap-3"
            >
              <Input
                type="email"
                placeholder="Digite o e-mail usado na solicitação"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {searched && !loading && solicitations.length === 0 && (
          <Card className="w-full max-w-xl">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhuma solicitação encontrada para este e-mail.</p>
            </CardContent>
          </Card>
        )}

        {solicitations.length > 0 && (
          <div className="w-full max-w-xl space-y-4">
            <p className="text-sm text-muted-foreground">{solicitations.length} solicitação(ões) encontrada(s)</p>
            {solicitations.map((sol) => {
              const st = statusConfig[sol.status] || statusConfig.pendente;
              return (
                <Card key={sol.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sol.created_at).toLocaleDateString("pt-BR")} · {sectorMap[sol.sector_id] || "—"}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${st.color}`}>
                        {st.icon} {st.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Sua solicitação:</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{sol.descricao}</p>
                    </div>

                    {sol.resposta ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-green-700 mb-1">
                          Retorno da equipe RSIM
                          {sol.responded_at && ` · ${new Date(sol.responded_at).toLocaleDateString("pt-BR")}`}
                        </p>
                        <p className="text-sm text-green-900 whitespace-pre-wrap">{sol.resposta}</p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs text-yellow-700">Aguardando retorno da equipe.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Acompanhar;
