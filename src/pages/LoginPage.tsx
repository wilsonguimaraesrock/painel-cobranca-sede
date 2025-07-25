
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { UserRound, Lock } from "lucide-react";

interface UserCredential {
  username: string;
  password: string;
}

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Verificar se já está logado ao carregar a página
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // Hardcoded credentials
  const validCredentials: UserCredential[] = [
    { username: "wadevengaADM", password: "Salmos2714" },
    { username: "tati.venga", password: "tati.venga" },
    { username: "Kamilla.vitoriano", password: "396502" },
    { username: "nathaly.alves", password: "156890" }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpar erro anterior
    setError("");
    
    // Verify credentials
    const isValid = validCredentials.some(
      (cred) => cred.username === username && cred.password === password
    );

    if (isValid) {
      // Store login state in localStorage
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", username);
      
      // Show success message
      toast.success("Login efetuado com sucesso", {
        description: `Bem-vindo(a), ${username}!`
      });
      
      // Redirect to main page using navigate WITH replace
      // We use a small timeout to ensure the toast is shown before redirect
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    } else {
      setError("Usuário ou senha inválidos");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 bg-primary text-primary-foreground rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-center">CRM de Cobrança</CardTitle>
          <CardDescription className="text-center text-primary-foreground/90">
            Rockfeller Navegantes
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center">
                <UserRound className="mr-2" size={18} />
                <label htmlFor="username" className="text-sm font-medium">
                  Nome de usuário
                </label>
              </div>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <Lock className="mr-2" size={18} />
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Rockfeller Navegantes
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
