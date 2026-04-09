import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const Solicitar = () => {
  const [sectors, setSectors] = useState<{ id: string; name: string }[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase.from("sectors").select("id, name").order("name").then(({ data }) => {
      if (data) setSectors(data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !sectorId || !descricao) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("solicitations").insert({
      nome_solicitante: nome,
      email,
      telefone: telefone || null,
      sector_id: sectorId,
      descricao,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao enviar solicitação.", description: error.message, variant: "destructive" });
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center p-5 font-sans">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-10 pb-10 space-y-4">
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-bold text-foreground">Solicitação Enviada!</h2>
            <p className="text-muted-foreground text-sm">
              Sua solicitação foi recebida com sucesso. Entraremos em contato pelo e-mail informado.
            </p>
            <Button onClick={() => { setSubmitted(false); setNome(""); setEmail(""); setTelefone(""); setSectorId(""); setDescricao(""); }}>
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center p-5 font-sans">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Nova Solicitação de Serviço</CardTitle>
          <CardDescription>RSIM Consultoria · Formulário Público</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Nome *</label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">E-mail *</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Telefone</label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Setor *</label>
              <Select value={sectorId} onValueChange={setSectorId}>
                <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Descrição do Serviço *</label>
              <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva sua solicitação..." rows={4} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Solicitar;
