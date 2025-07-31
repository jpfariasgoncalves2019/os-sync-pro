# Melhoria: PDF usa dados reais da empresa

## O que mudou
- O gerador de PDF (`generateOSPDF`) agora recebe os dados reais da empresa como parâmetro.
- Os campos Nome Fantasia, CNPJ, Telefone e Endereço no PDF são preenchidos com os dados salvos pelo usuário nas Configurações.
- Não há mais valores hardcoded para os dados da empresa no PDF.

## Como funciona
- Ao gerar o PDF de uma OS, a tela busca os dados da empresa do backend (Supabase) e passa para a função `generateOSPDF`.
- Se algum dado não estiver preenchido, o PDF mostra um valor padrão (exemplo: "Nome da Empresa").

## Exemplo de uso
```typescript
import { generateOSPDF, EmpresaConfig } from "@/lib/pdf-generator";

const empresa: EmpresaConfig = {
  nome_fantasia: "Oficina do Luis",
  cnpj: "00.000.000/0001-00",
  telefone: "(11) 99999-9999",
  endereco: "Rua Exemplo, 123 - São Paulo/SP",
};

const pdfBlob = await generateOSPDF(os, empresa);
```

## Motivo da melhoria
- Garante que o PDF sempre reflita os dados reais e atualizados da empresa, conforme configurado pelo usuário.
- Atende ao critério de aceite do Módulo 2: qualquer alteração nas Configurações reflete imediatamente nos novos PDFs gerados.

---

Próximo item: (opcional) upload e uso de logo da empresa no PDF.
