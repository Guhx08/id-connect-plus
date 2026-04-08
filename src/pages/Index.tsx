import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import type { Session } from "@supabase/supabase-js";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginMode, setLoginMode] = useState<"main" | "credentials" | "signup">("main");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPass, setSignupPass] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Demo credentials login
  const handleCredentialsLogin = () => {
    const users: Record<string, string> = {
      admin: "admin123",
      corretor1: "corretor123",
      gestor: "gestor123",
    };
    if (users[user] && users[user] === pass) {
      // Store in sessionStorage to let iframe know
      sessionStorage.setItem("rsim_auth", "1");
      sessionStorage.setItem("rsim_user", user);
      setSession({} as Session); // fake session for credentials login
    } else {
      setError("Usuário ou senha incorretos.");
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError("Erro ao conectar com Google. Tente novamente.");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) {
        return; // browser will redirect
      }
      // session will be set via onAuthStateChange
    } catch {
      setError("Erro ao conectar com Google. Tente novamente.");
      setGoogleLoading(false);
    }
  };

  const handleSignup = async () => {
    setError("");
    setSuccess("");
    if (!signupEmail || !signupPass) {
      setError("Preencha e-mail e senha.");
      return;
    }
    if (signupPass !== signupConfirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (signupPass.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPass,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      setSuccess("Cadastro realizado! Verifique seu e-mail para confirmar.");
      setSignupEmail("");
      setSignupPass("");
      setSignupConfirm("");
    } catch {
      setError("Erro ao cadastrar. Tente novamente.");
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("rsim_auth");
    sessionStorage.removeItem("rsim_user");
    await supabase.auth.signOut();
    setSession(null);
  };

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1e40af 100%)",
        color: "white", fontFamily: "'DM Sans', sans-serif"
      }}>
        <p>Carregando...</p>
      </div>
    );
  }

  // If authenticated (either Google or credentials), show the app
  if (session || sessionStorage.getItem("rsim_auth") === "1") {
    return (
      <iframe
        src="/rsim.html"
        title="RSIM Consultoria"
        style={{
          position: "fixed", top: 0, left: 0,
          width: "100%", height: "100%",
          border: "none", margin: 0, padding: 0,
        }}
      />
    );
  }

  // Login screen
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1e40af 100%)",
      fontFamily: "'DM Sans', sans-serif",
      padding: "20px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{
        background: "white", borderRadius: "16px", padding: "40px",
        width: "100%", maxWidth: "420px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        textAlign: "center",
      }}>
        {/* Logo */}
        <div style={{ marginBottom: "24px" }}>
          <img
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0NDYwLCAyMDIwLzA1LzEyLTE2OjA0OjE3ICAgICAgICAiPg=="
            alt="RSIM Logo"
            style={{ width: "80px", height: "auto" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
        <h2 style={{
          fontSize: "1.5rem", fontWeight: 700, color: "#1e293b",
          margin: "0 0 4px"
        }}>Portal do Corretor</h2>
        <p style={{
          fontSize: "0.85rem", color: "#64748b", margin: "0 0 28px"
        }}>RSIM Consultoria · Área Restrita</p>

        {loginMode === "main" ? (
          <>
            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              style={{
                width: "100%", padding: "14px", border: "1.5px solid #e2e8f0",
                borderRadius: "10px", background: "#fff", color: "#1e293b",
                fontSize: "0.95rem", fontWeight: 600, cursor: googleLoading ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                transition: "all 0.2s", marginBottom: "12px",
                opacity: googleLoading ? 0.7 : 1,
              }}
              onMouseOver={(e) => { if (!googleLoading) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}}
              onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              {googleLoading ? "Conectando..." : "Entrar com Google"}
            </button>

            {/* Separator */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "18px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500 }}>ou</span>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div>
            </div>

            {/* Credentials button */}
            <button
              onClick={() => setLoginMode("credentials")}
              style={{
                width: "100%", padding: "14px", border: "none",
                borderRadius: "10px", background: "#2563eb", color: "white",
                fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#1d4ed8"}
              onMouseOut={(e) => e.currentTarget.style.background = "#2563eb"}
            >
              Entrar com Usuário e Senha
            </button>
          </>
        ) : (
          <>
            {/* Username/Password form */}
            <input
              type="text"
              placeholder="Usuário"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              style={{
                width: "100%", padding: "14px 16px", border: "1.5px solid #e2e8f0",
                borderRadius: "10px", fontSize: "0.95rem", marginBottom: "12px",
                outline: "none", boxSizing: "border-box",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "#2563eb"}
              onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
            />
            <input
              type="password"
              placeholder="Senha"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCredentialsLogin()}
              style={{
                width: "100%", padding: "14px 16px", border: "1.5px solid #e2e8f0",
                borderRadius: "10px", fontSize: "0.95rem", marginBottom: "12px",
                outline: "none", boxSizing: "border-box",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "#2563eb"}
              onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
            />

            {error && (
              <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: "0 0 12px" }}>{error}</p>
            )}

            <button
              onClick={handleCredentialsLogin}
              style={{
                width: "100%", padding: "14px", border: "none",
                borderRadius: "10px", background: "#2563eb", color: "white",
                fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s", marginBottom: "12px",
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#1d4ed8"}
              onMouseOut={(e) => e.currentTarget.style.background = "#2563eb"}
            >
              Entrar
            </button>

            <button
              onClick={() => { setLoginMode("main"); setError(""); }}
              style={{
                background: "none", border: "none", color: "#2563eb",
                fontSize: "0.85rem", cursor: "pointer", fontWeight: 500,
              }}
            >
              ← Voltar
            </button>
          </>
        )}

        {error && loginMode === "main" && (
          <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: "12px 0 0" }}>{error}</p>
        )}

        <div style={{
          fontSize: "0.75rem", color: "#94a3b8", marginTop: "24px"
        }}>
          Problemas de acesso? Fale com seu gestor RSIM.
        </div>
      </div>
    </div>
  );
};

export default Index;
