import jsPDF from "jspdf";
import "jspdf-autotable";
import { OrdemServico, formatCurrency, formatDate } from "./types";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}


export interface EmpresaConfig {
  nome_fantasia: string;
  cnpj?: string;
  telefone?: string;
  endereco?: string;
  logo_empresa?: string | null;
}


export async function generateOSPDF(
  os: OrdemServico,
  empresa?: EmpresaConfig
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Margens
  const margin = 20;
  const pageWidth = 210; // A4 width
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Set font
  doc.setFont("helvetica");

  // Header - Company Info
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(
    empresa?.nome_fantasia || "Oficina do Luis",
    margin,
    currentY
  );

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  currentY += 5;
  
  // Info da empresa no lado esquerdo
  doc.text(empresa?.cnpj || "37771984000114", margin, currentY);
  currentY += 4;
  doc.text(empresa?.endereco || "Estrada do Quilombo numero 1000 - Feitoria", margin, currentY);
  currentY += 4;
  doc.text("93054-600 - São Leopoldo/RS", margin, currentY);

  // Info de contato no lado direito
  const rightMargin = pageWidth - margin;
  doc.text(`Tel.: ${empresa?.telefone || "51 982279141"}`, rightMargin - 40, currentY - 8, { align: "right" });
  doc.text("oficinadeluis.stf@gmail.com", rightMargin - 40, currentY - 4, { align: "right" });
  doc.text("Contato: Luis Felipe", rightMargin - 40, currentY, { align: "right" });

  // Dados do Cliente
  currentY += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Dados do Cliente", margin, currentY);

  currentY += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(os.clientes?.nome || "Cliente não informado", margin, currentY);
  
  // Data no lado direito
  doc.text(`Data: ${formatDate(os.created_at || os.data)}`, rightMargin - 40, currentY, { align: "right" });

  // OS Number - centralizado e destacado
  currentY += 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  
  // Fundo cinza para o número da OS
  doc.setFillColor(128, 128, 128);
  doc.rect(margin, currentY - 5, contentWidth, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.text(`ORÇAMENTO Nº ${os.os_numero_humano}`, pageWidth / 2, currentY, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // Seções de Serviços e Produtos
  currentY += 15;
  
  // Serviços
  if (os.servicos_os && os.servicos_os.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Serviços", margin, currentY);

    const servicosData = os.servicos_os.map((servico) => [
      servico.nome_servico,
      "1",
      "un",
      formatCurrency(servico.valor_unitario),
      formatCurrency(servico.valor_total),
    ]);

    currentY += 5;
    doc.autoTable({
      startY: currentY,
      head: [["Nome", "Quantidade", "Unidade", "Valor Unitário", "Valor Total"]],
      body: servicosData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [200, 200, 200] },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.4 },
        1: { cellWidth: contentWidth * 0.15, halign: "center" },
        2: { cellWidth: contentWidth * 0.1, halign: "center" },
        3: { cellWidth: contentWidth * 0.175, halign: "right" },
        4: { cellWidth: contentWidth * 0.175, halign: "right" },
      },
    });

    // Total Serviços
    currentY = (doc as any).lastAutoTable.finalY + 2;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Serviços`, pageWidth - margin - 60, currentY, { align: "right" });
    doc.text(formatCurrency(os.total_servicos || 0), pageWidth - margin, currentY, { align: "right" });
    currentY += 10;
  }

  // Produtos
  if (os.produtos_os && os.produtos_os.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Produtos", margin, currentY);

    const produtosData = os.produtos_os.map((produto) => [
      produto.nome_produto,
      produto.quantidade.toString(),
      "un",
      formatCurrency(produto.valor_unitario),
      formatCurrency(produto.valor_total),
    ]);

    currentY += 5;
    doc.autoTable({
      startY: currentY,
      head: [["Nome", "Quantidade", "Unidade", "Valor Unitário", "Valor Total"]],
      body: produtosData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [200, 200, 200] },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.4 },
        1: { cellWidth: contentWidth * 0.15, halign: "center" },
        2: { cellWidth: contentWidth * 0.1, halign: "center" },
        3: { cellWidth: contentWidth * 0.175, halign: "right" },
        4: { cellWidth: contentWidth * 0.175, halign: "right" },
      },
    });

    // Total Produtos
    currentY = (doc as any).lastAutoTable.finalY + 2;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Produtos`, pageWidth - margin - 60, currentY, { align: "right" });
    doc.text(formatCurrency(os.total_produtos || 0), pageWidth - margin, currentY, { align: "right" });
    currentY += 10;
  }

  // Expenses
  if (os.despesas_os && os.despesas_os.length > 0) {
    currentY += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DESPESAS", margin, currentY);

    const despesasData = os.despesas_os.map((despesa) => [
      despesa.descricao,
      formatCurrency(despesa.valor),
    ]);

    currentY += 5;
    doc.autoTable({
      startY: currentY,
      head: [["Descrição", "Valor (R$)"]],
      body: despesasData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.7 },
        1: { cellWidth: contentWidth * 0.3, halign: "right" },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Totais - layout conforme imagem
  currentY += 15;
  
  // Subtotal e Total no lado direito
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", pageWidth - margin - 60, currentY, { align: "right" });
  doc.text(formatCurrency((os.total_servicos || 0) + (os.total_produtos || 0)), pageWidth - margin, currentY, { align: "right" });
  
  currentY += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Total Orçamento", pageWidth - margin - 60, currentY, { align: "right" });
  doc.text(formatCurrency(os.total_geral || 0), pageWidth - margin, currentY, { align: "right" });

  currentY += 15;

  // Observações
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Observações", margin, currentY);

  currentY += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  if (os.forma_pagamento) {
    doc.text(`Condições de Pagamento: ${os.forma_pagamento}`, margin, currentY);
    currentY += 5;
  }

  if (os.garantia) {
    doc.text(`Garantia: ${os.garantia}`, margin, currentY);
    currentY += 5;
  }

  if (os.observacoes) {
    const splitText = doc.splitTextToSize(os.observacoes, contentWidth);
    doc.text(splitText, margin, currentY);
    currentY += splitText.length * 5;
  }

  // Footer - Assinatura
  currentY += 30;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Centralizar nome da empresa e assinante
  doc.text(empresa?.nome_fantasia || "Oficina do Luis", pageWidth / 2, currentY, { align: "center" });
  currentY += 5;
  doc.text("Luis Felipe", pageWidth / 2, currentY, { align: "center" });

  // Convert to blob
  const pdfBlob = doc.output("blob");
  return pdfBlob;
}