import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { 
  Building2, 
  Key, 
  Save, 
  TestTube,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from "lucide-react";

export default function Configuracoes() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [openAIKeyStatus, setOpenAIKeyStatus] = useState<boolean | null>(null);
  
  const [empresaData, setEmpresaData] = useState({
    nome_fantasia: "Oficina do Luis",
    cnpj: "",
    telefone: "",
    endereco: "",
  });
  
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    // Test existing OpenAI key on load
    testExistingKey();
  }, []);

  const testExistingKey = async () => {
    try {
      const response = await apiClient.testOpenAIKey();
      if (response.ok) {
        setOpenAIKeyStatus(response.data.openai_key_ok);
      }
    } catch (error) {
      console.error("Erro ao testar chave existente:", error);
    }
  };

  const handleSaveEmpresa = async () => {
    setLoading(true);
    try {
      // Simular salvamento dos dados da empresa
      // Em produção, implementar endpoint para configurações da empresa
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações salvas",
        description: "As configurações da empresa foram atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações da empresa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Informe uma chave API válida",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      toast({
        title: "Erro",
        description: "A chave deve começar com 'sk-'",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.saveOpenAIKey(apiKey);
      
      if (response.ok) {
        toast({
          title: "Chave salva",
          description: "Chave OpenAI salva com sucesso",
        });
        setApiKey("");
        setOpenAIKeyStatus(true);
      } else {
        toast({
          title: "Erro",
          description: response.error?.message || "Erro ao salvar chave",
          variant: "destructive", 
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar chave OpenAI",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestApiKey = async () => {
    setTestingKey(true);
    try {
      const response = await apiClient.testOpenAIKey();
      
      if (response.ok) {
        const isValid = response.data.openai_key_ok;
        setOpenAIKeyStatus(isValid);
        
        toast({
          title: isValid ? "Chave válida" : "Chave inválida",
          description: isValid 
            ? "A chave OpenAI está funcionando corretamente" 
            : "A chave OpenAI não está funcionando",
          variant: isValid ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Erro no teste",
          description: response.error?.message || "Erro ao testar chave",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao testar chave OpenAI",
        variant: "destructive",
      });
    } finally {
      setTestingKey(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema e da sua empresa
        </p>
      </div>

      {/* Dados da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome Fantasia *</Label>
              <Input
                value={empresaData.nome_fantasia}
                onChange={(e) => setEmpresaData(prev => ({ 
                  ...prev, 
                  nome_fantasia: e.target.value 
                }))}
                placeholder="Nome da sua empresa"
              />
            </div>
            
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                value={empresaData.cnpj}
                onChange={(e) => setEmpresaData(prev => ({ 
                  ...prev, 
                  cnpj: e.target.value 
                }))}
                placeholder="00.000.000/0001-00"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={empresaData.telefone}
                onChange={(e) => setEmpresaData(prev => ({ 
                  ...prev, 
                  telefone: e.target.value 
                }))}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Endereço</Label>
            <Textarea
              value={empresaData.endereco}
              onChange={(e) => setEmpresaData(prev => ({ 
                ...prev, 
                endereco: e.target.value 
              }))}
              placeholder="Endereço completo da empresa"
              rows={2}
            />
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleSaveEmpresa} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Salvando..." : "Salvar Dados"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* OpenAI API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Chave OpenAI API
            {openAIKeyStatus !== null && (
              <Badge variant={openAIKeyStatus ? "default" : "destructive"}>
                {openAIKeyStatus ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ativa
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Inválida
                  </>
                )}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Para que serve?</h4>
            <p className="text-sm text-blue-800">
              A chave OpenAI permite gerar automaticamente descrições de serviços, 
              sugestões de produtos e melhorar a experiência do sistema com IA.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Nova Chave API</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <Button onClick={handleSaveApiKey} disabled={loading || !apiKey.trim()}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Obtenha sua chave em: 
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1"
              >
                platform.openai.com/api-keys
              </a>
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={handleTestApiKey} 
              disabled={testingKey || openAIKeyStatus === null}
            >
              <TestTube className="w-4 h-4 mr-2" />
              {testingKey ? "Testando..." : "Testar Chave Atual"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Versão:</span>
            <span className="text-sm text-muted-foreground">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Última Sincronização:</span>
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Status do Sistema:</span>
            <Badge variant="default">Online</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}