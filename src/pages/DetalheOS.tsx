import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { OrdemServico, formatCurrency, formatDateTime, STATUS_CONFIG } from "@/lib/types";
import { generateOSPDF } from "@/lib/pdf-generator";
import { shareViaWhatsApp } from "@/lib/whatsapp-share";
import { 
  ArrowLeft, 
  Edit, 
  FileDown, 
  MessageCircle, 
  Copy, 
  Trash2, 
  Phone, 
  Mail, 
  Wrench,
  Calendar,
  User,
  Package,
  Receipt
} from "lucide-react";

export default function DetalheOS() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [os, setOS] = useState<OrdemServico | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const loadOS = async () => {
      if (!id) return;
      
      try {
        const response = await apiClient.getOS(id);
        if (response.ok) {
          setOS(response.data);
        } else {
          toast({
            title: "Erro",
            description: "OS não encontrada",
            variant: "destructive",
          });
          navigate("/");
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar OS",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    loadOS();
  }, [id, navigate, toast]);

  const handleEdit = () => {
    navigate(`/editar-os/${id}`);
  };

  const handleDuplicate = () => {
    navigate("/nova-os", { state: { duplicateFrom: os } });
  };

  const handleDelete = async () => {
    if (!id || !confirm("Tem certeza que deseja excluir esta OS?")) return;

    try {
      const response = await apiClient.deleteOS(id);
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "OS excluída com sucesso",
        });
        navigate("/");
      } else {
        throw new Error(response.error?.message);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir OS",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePDF = async () => {
    if (!os) return;

    setGenerating(true);
    try {
      const pdfBlob = await generateOSPDF(os);
      const fileName = `OS-${os.os_numero_humano}.pdf`;
      
      // Try to share via WhatsApp first
      const clientPhone = os.clientes?.telefone || "";
      const shared = await shareViaWhatsApp(pdfBlob, fileName, clientPhone);
      
      if (!shared) {
        // Fallback: Download PDF
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "PDF Gerado",
          description: "PDF salvo. Você pode compartilhar quando quiser.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!os) return;
    
    try {
      const clientPhone = os.clientes?.telefone || "";
      const clientName = os.clientes?.nome || "Cliente";
      await shareViaWhatsApp(null, "", clientPhone, `Olá ${clientName}, sua OS ${os.os_numero_humano} está pronta!`);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao abrir WhatsApp",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!os) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">OS não encontrada</h1>
          <Button onClick={() => navigate("/")} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[os.status] || STATUS_CONFIG.rascunho;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/")} size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{os.os_numero_humano}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
              {os.sync_status && (
                <Badge variant="outline">
                  {os.sync_status === "synced" ? "Sincronizado" : "Pendente"}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit} size="sm">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleGeneratePDF} disabled={generating} size="sm">
            <FileDown className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleWhatsApp} size="sm">
            <MessageCircle className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleDuplicate} size="sm">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleDelete} size="sm" className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{os.clientes?.nome || "Nome não informado"}</p>
              {os.clientes?.telefone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {os.clientes.telefone}
                </div>
              )}
              {os.clientes?.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {os.clientes.email}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Equipamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Equipamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {os.equipamento_os ? (
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Tipo</TableCell>
                    <TableCell>{os.equipamento_os.tipo}</TableCell>
                  </TableRow>
                  {os.equipamento_os.marca && (
                    <TableRow>
                      <TableCell className="font-medium">Marca</TableCell>
                      <TableCell>{os.equipamento_os.marca}</TableCell>
                    </TableRow>
                  )}
                  {os.equipamento_os.modelo && (
                    <TableRow>
                      <TableCell className="font-medium">Modelo</TableCell>
                      <TableCell>{os.equipamento_os.modelo}</TableCell>
                    </TableRow>
                  )}
                  {os.equipamento_os.numero_serie && (
                    <TableRow>
                      <TableCell className="font-medium">Nº Série</TableCell>
                      <TableCell>{os.equipamento_os.numero_serie}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">Nenhum equipamento cadastrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Serviços */}
      {os.servicos_os && os.servicos_os.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {os.servicos_os.map((servico, index) => (
                  <TableRow key={index}>
                    <TableCell>{servico.nome_servico}</TableCell>
                    <TableCell className="text-right">{formatCurrency(servico.valor_total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-medium">Subtotal Serviços</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(os.total_servicos || 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Produtos */}
      {os.produtos_os && os.produtos_os.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Qtde</TableHead>
                  <TableHead className="text-right">V. Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {os.produtos_os.map((produto, index) => (
                  <TableRow key={index}>
                    <TableCell>{produto.nome_produto}</TableCell>
                    <TableCell className="text-center">{produto.quantidade}</TableCell>
                    <TableCell className="text-right">{formatCurrency(produto.valor_unitario)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(produto.valor_total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="font-medium">Subtotal Produtos</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(os.total_produtos || 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Despesas */}
      {os.despesas_os && os.despesas_os.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {os.despesas_os.map((despesa, index) => (
                  <TableRow key={index}>
                    <TableCell>{despesa.descricao}</TableCell>
                    <TableCell className="text-right">{formatCurrency(despesa.valor)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-medium">Subtotal Despesas</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(os.total_despesas || 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Totais e Condições */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(os.total_geral || 0)}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Serviços:</span>
                <span>{formatCurrency(os.total_servicos || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Produtos:</span>
                <span>{formatCurrency(os.total_produtos || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Despesas:</span>
                <span>{formatCurrency(os.total_despesas || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Condições</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {os.forma_pagamento && (
              <div>
                <p className="text-sm font-medium">Forma de Pagamento</p>
                <p className="text-sm text-muted-foreground">{os.forma_pagamento}</p>
              </div>
            )}
            {os.garantia && (
              <div>
                <p className="text-sm font-medium">Garantia</p>
                <p className="text-sm text-muted-foreground">{os.garantia}</p>
              </div>
            )}
            {os.observacoes && (
              <div>
                <p className="text-sm font-medium">Observações</p>
                <p className="text-sm text-muted-foreground">{os.observacoes}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Data de Criação</p>
              <p className="text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 inline mr-1" />
                {formatDateTime(os.created_at || os.data)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}