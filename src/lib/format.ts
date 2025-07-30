export function formatPhoneNumber(value: string) {
  // Remove todos os caracteres não numéricos
  const cleaned = value.replace(/\D/g, '');
  
  // Aplica a máscara (XX) XXXXX-XXXX
  if (cleaned.length <= 11) {
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }
    if (cleaned.length > 7) {
      formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return formatted;
  }
  return value;
}

export function normalizePhoneNumber(value: string) {
  // Remove todos os caracteres não numéricos
  const cleaned = value.replace(/\D/g, '');
  
  // Adiciona o código do país (+55) se não existir
  if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    return `+55${cleaned}`;
  }
  return cleaned;
}
