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

  // Header - Logo da Empresa (se houver)
  if (empresa?.logo_empresa) {
    try {
      // Baixa a imagem e converte para base64
      const response = await fetch(empresa.logo_empresa);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      // Adiciona a imagem (logo) no topo
      // Ajusta tamanho máximo (ex: 40mm largura, 20mm altura)
      const imgProps = doc.getImageProperties(base64);
      const maxWidth = 40;
      const maxHeight = 20;
      let imgWidth = imgProps.width;
      let imgHeight = imgProps.height;
      // Redimensiona mantendo proporção
      if (imgWidth > maxWidth) {
        imgHeight = (imgHeight * maxWidth) / imgWidth;
        imgWidth = maxWidth;
      }
      if (imgHeight > maxHeight) {
        imgWidth = (imgWidth * maxHeight) / imgHeight;
        imgHeight = maxHeight;
      }
      // Centraliza horizontalmente
      const x = margin + (contentWidth - imgWidth) / 2;
      doc.addImage(base64, "PNG", x, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 4;
    } catch (e) {
      // Se falhar, ignora a logo
      currentY += 4;
    }
  }

  // Header - Company Info
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(
    empresa?.nome_fantasia || "Nome da Empresa",
    margin,
    currentY
  );

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  currentY += 6;
  doc.text(
    `CNPJ: ${empresa?.cnpj || "00.000.000/0001-00"}`,
    margin,
    currentY
  );
  currentY += 4;
  doc.text(
    `Telefone: ${empresa?.telefone || "(11) 99999-9999"}`,
    margin,
    currentY
  );
  currentY += 4;
  doc.text(
    `Endereço: ${empresa?.endereco || "Rua Exemplo, 123 - São Paulo/SP"}`,
    margin,
    currentY
  );

  // OS Number and Date
  currentY += 15;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`ORDEM DE SERVIÇO: ${os.os_numero_humano}`, margin, currentY);

  currentY += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${formatDate(os.created_at || os.data)}`, margin, currentY);
  doc.text(`Status: ${os.status}`, pageWidth - margin - 30, currentY);

  // Client Section
  currentY += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CLIENTE", margin, currentY);

  currentY += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${os.clientes?.nome || "Nome não informado"}`, margin, currentY);
  
  if (os.clientes?.telefone) {
    currentY += 5;
    doc.text(`Telefone: ${os.clientes.telefone}`, margin, currentY);
  }
  
  if (os.clientes?.email) {
    currentY += 5;
    doc.text(`Email: ${os.clientes.email}`, margin, currentY);
  }

  // Equipment Section
  if (os.equipamento_os) {
    currentY += 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("EQUIPAMENTO", margin, currentY);

    const equipmentData = [];
    if (os.equipamento_os.tipo) equipmentData.push(["Tipo", os.equipamento_os.tipo]);
    if (os.equipamento_os.marca) equipmentData.push(["Marca", os.equipamento_os.marca]);
    if (os.equipamento_os.modelo) equipmentData.push(["Modelo", os.equipamento_os.modelo]);
    if (os.equipamento_os.numero_serie) equipmentData.push(["Nº Série", os.equipamento_os.numero_serie]);

    currentY += 5;
    doc.autoTable({
      startY: currentY,
      head: [["Campo", "Valor"]],
      body: equipmentData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.3 },
        1: { cellWidth: contentWidth * 0.7 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Services and Products Table
  const itemsData = [];
  
  // Add services
  if (os.servicos_os && os.servicos_os.length > 0) {
    os.servicos_os.forEach((servico) => {
      itemsData.push([
        `${servico.nome_servico} (Serviço)`,
        "1",
        formatCurrency(servico.valor_unitario),
        formatCurrency(servico.valor_total),
      ]);
    });
  }

  // Add products
  if (os.produtos_os && os.produtos_os.length > 0) {
    os.produtos_os.forEach((produto) => {
      itemsData.push([
        `${produto.nome_produto} (Produto)`,
        produto.quantidade.toString(),
        formatCurrency(produto.valor_unitario),
        formatCurrency(produto.valor_total),
      ]);
    });
  }

  if (itemsData.length > 0) {
    currentY += 5;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ITENS", margin, currentY);

    currentY += 5;
    doc.autoTable({
      startY: currentY,
      head: [["Item", "Qtde", "V. Unit. (R$)", "Total (R$)"]],
      body: itemsData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.5 },
        1: { cellWidth: contentWidth * 0.15, halign: "center" },
        2: { cellWidth: contentWidth * 0.175, halign: "right" },
        3: { cellWidth: contentWidth * 0.175, halign: "right" },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
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

  // Totals
  currentY += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAIS", margin, currentY);

  const totalsData = [];
  if (os.total_servicos && os.total_servicos > 0) {
    totalsData.push(["Subtotal Serviços:", formatCurrency(os.total_servicos)]);
  }
  if (os.total_produtos && os.total_produtos > 0) {
    totalsData.push(["Subtotal Produtos:", formatCurrency(os.total_produtos)]);
  }
  if (os.total_despesas && os.total_despesas > 0) {
    totalsData.push(["Subtotal Despesas:", formatCurrency(os.total_despesas)]);
  }
  totalsData.push(["TOTAL GERAL:", formatCurrency(os.total_geral || 0)]);

  currentY += 5;
  doc.autoTable({
    startY: currentY,
    body: totalsData,
    margin: { left: margin + contentWidth * 0.5, right: margin },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.25, fontStyle: "bold" },
      1: { cellWidth: contentWidth * 0.25, halign: "right", fontStyle: "bold" },
    },
    theme: "plain",
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Payment and Conditions
  if (os.forma_pagamento || os.garantia || os.observacoes) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("CONDIÇÕES", margin, currentY);

    currentY += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    if (os.forma_pagamento) {
      doc.text(`Forma de Pagamento: ${os.forma_pagamento}`, margin, currentY);
      currentY += 5;
    }

    if (os.garantia) {
      doc.text(`Garantia: ${os.garantia}`, margin, currentY);
      currentY += 5;
    }

    if (os.observacoes) {
      doc.text("Observações:", margin, currentY);
      currentY += 5;
      
      // Split long text into multiple lines
      const splitText = doc.splitTextToSize(os.observacoes, contentWidth);
      doc.text(splitText, margin, currentY);
      currentY += splitText.length * 5;
    }
  }

  // Footer - Signature
  currentY += 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Assinatura do Cliente: ________________________", margin, currentY);
  
  currentY += 10;
  doc.text(`Data: ___/___/______`, margin, currentY);

  // Convert to blob
  const pdfBlob = doc.output("blob");
  return pdfBlob;
}