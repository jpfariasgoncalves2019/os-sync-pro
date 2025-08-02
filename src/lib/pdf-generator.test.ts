import { generateOSPDF } from "./pdf-generator";

const mockOS = {
  os_numero_humano: "OS-202508-00001",
  clientes: { nome: "Cliente Teste" },
  created_at: new Date().toISOString(),
  data: new Date().toISOString(),
  servicos_os: [
    { nome_servico: "Troca de óleo", valor_unitario: 50, valor_total: 50 }
  ],
  produtos_os: [
    { nome_produto: "Óleo 5W30", quantidade: 1, valor_unitario: 30, valor_total: 30 }
  ],
  despesas_os: [
    { descricao: "Deslocamento", valor: 10 }
  ],
  total_servicos: 50,
  total_produtos: 30,
  total_geral: 90,
  forma_pagamento: "À vista",
  garantia: "3 meses",
  observacoes: "Teste de geração de PDF."
};

const mockEmpresa = {
  nome_fantasia: "Oficina Teste",
  cnpj: "12345678000199",
  telefone: "51999999999",
  endereco: "Rua Teste, 123"
};

(async () => {
  try {
    const blob = await generateOSPDF(mockOS as any, mockEmpresa);
    if (blob instanceof Blob && blob.size > 0) {
      console.log("[TESTE PDF] PDF gerado com sucesso! Tamanho:", blob.size);
    } else {
      console.error("[TESTE PDF] Falha ao gerar PDF: Blob inválido.");
    }
  } catch (err) {
    console.error("[TESTE PDF] Erro ao gerar PDF:", err);
  }
})();
