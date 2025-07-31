import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/types";

interface ItemListProps<T> {
  items: T[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof T, value: any) => void;
  children: (item: T, index: number, updateField: (field: keyof T, value: any) => void) => ReactNode;
  addButtonText: string;
  emptyMessage: string;
}

export function ItemList<T>({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  children,
  addButtonText,
  emptyMessage,
}: ItemListProps<T>) {
  const updateField = (index: number) => (field: keyof T, value: any) => {
    onUpdateItem(index, field, value);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Itens</h3>
        <Button onClick={onAddItem} size="sm" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {addButtonText}
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {emptyMessage}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex gap-4 items-start">
                  <div className="flex-1 grid gap-4">
                    {children(item, index, updateField(index))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface MoneyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MoneyInput({ label, value, onChange, placeholder, disabled }: MoneyInputProps) {
  const [displayValue, setDisplayValue] = React.useState("");

  // Atualiza o valor de exibição quando o valor prop muda
  React.useEffect(() => {
    if (value > 0) {
      setDisplayValue(value.toFixed(2).replace('.', ','));
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Remove caracteres não permitidos (mantém apenas números, vírgula e ponto)
    inputValue = inputValue.replace(/[^\d,\.]/g, '');
    
    // Permite apenas uma vírgula ou ponto
    const commaCount = (inputValue.match(/,/g) || []).length;
    const dotCount = (inputValue.match(/\./g) || []).length;
    
    if (commaCount > 1) {
      inputValue = inputValue.replace(/,([^,]*)$/, '$1');
    }
    if (dotCount > 1) {
      inputValue = inputValue.replace(/\.([^\.]*)$/, '$1');
    }
    
    // Se tem vírgula e ponto, remove o ponto
    if (inputValue.includes(',') && inputValue.includes('.')) {
      inputValue = inputValue.replace(/\./g, '');
    }
    
    // Limita casas decimais a 2
    if (inputValue.includes(',')) {
      const parts = inputValue.split(',');
      if (parts[1] && parts[1].length > 2) {
        inputValue = parts[0] + ',' + parts[1].substring(0, 2);
      }
    } else if (inputValue.includes('.')) {
      const parts = inputValue.split('.');
      if (parts[1] && parts[1].length > 2) {
        inputValue = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
    
    setDisplayValue(inputValue);
    
    // Converte para número para o callback
    let numericValue = 0;
    if (inputValue) {
      // Substitui vírgula por ponto para conversão
      const normalizedValue = inputValue.replace(',', '.');
      const parsed = parseFloat(normalizedValue);
      if (!isNaN(parsed)) {
        numericValue = parsed;
      }
    }
    
    onChange(numericValue);
  };

  const handleBlur = () => {
    // Formata o valor final quando sai do campo
    if (value > 0) {
      setDisplayValue(value.toFixed(2).replace('.', ','));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permite teclas especiais
    if ([8, 9, 27, 13, 46, 35, 36, 37, 39, 188, 190].indexOf(e.keyCode) !== -1 ||
        // Permite Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
        (e.ctrlKey && [65, 67, 86, 88, 90].indexOf(e.keyCode) !== -1)) {
      return;
    }
    
    // Permite apenas números (0-9)
    if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          R$
        </span>
        <Input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10"
        />
      </div>
    </div>
  );
}