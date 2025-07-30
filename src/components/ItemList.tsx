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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Remove tudo exceto números, vírgulas e pontos
    inputValue = inputValue.replace(/[^\d,\.]/g, '');
    
    // Substitui vírgula por ponto para processamento
    inputValue = inputValue.replace(',', '.');
    
    // Verifica se é um número válido
    const numValue = parseFloat(inputValue);
    
    if (isNaN(numValue)) {
      onChange(0);
    } else {
      // Limita a 2 casas decimais
      const roundedValue = Math.round(numValue * 100) / 100;
      onChange(roundedValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Quando o campo perde o foco, formatar corretamente
    const inputValue = e.target.value.replace(/[^\d,\.]/g, '').replace(',', '.');
    const numValue = parseFloat(inputValue) || 0;
    onChange(numValue);
  };

  // Formatação para exibição: permite entrada direta
  const displayValue = value > 0 ? value.toFixed(2).replace('.', ',') : '';

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
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10"
        />
      </div>
    </div>
  );
}