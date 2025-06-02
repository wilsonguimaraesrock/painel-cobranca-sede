
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AddNewMonthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMonthAdded: (month: string) => void;
  existingMonths: string[];
}

// Função para converter MM-YYYY para formato por extenso
const formatMonthDisplay = (monthValue: string): string => {
  const [month, year] = monthValue.split('-');
  const monthNames = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];
  
  const monthIndex = parseInt(month) - 1;
  const shortYear = year.slice(-2);
  
  return `${monthNames[monthIndex]}/${shortYear}`;
};

const AddNewMonthDialog = ({ 
  isOpen, 
  onClose, 
  onMonthAdded, 
  existingMonths 
}: AddNewMonthDialogProps) => {
  const [monthName, setMonthName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const generateMonthSuggestions = () => {
    const now = new Date();
    const suggestions = [];
    
    // Gerar sugestões para os próximos 3 meses
    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthYear = date.toLocaleDateString('pt-BR', { 
        month: '2-digit', 
        year: 'numeric' 
      }).replace('/', '-');
      
      if (!existingMonths.includes(monthYear)) {
        suggestions.push({
          value: monthYear,
          display: formatMonthDisplay(monthYear)
        });
      }
    }
    
    return suggestions;
  };

  const handleCreateMonth = async () => {
    if (!monthName.trim()) {
      toast.error("Digite o nome do mês");
      return;
    }

    if (existingMonths.includes(monthName.trim())) {
      toast.error("Este mês já existe");
      return;
    }

    // Validar formato (MM-YYYY)
    const monthPattern = /^(0[1-9]|1[0-2])-\d{4}$/;
    if (!monthPattern.test(monthName.trim())) {
      toast.error("Use o formato MM-YYYY (ex: 01-2024)");
      return;
    }

    try {
      setIsCreating(true);
      
      // Aqui você pode adicionar lógica para criar o mês na planilha se necessário
      // Por enquanto, vamos apenas adicionar localmente
      
      onMonthAdded(monthName.trim());
      setMonthName("");
    } catch (error) {
      console.error("Erro ao criar novo mês:", error);
      toast.error("Erro ao criar novo mês");
    } finally {
      setIsCreating(false);
    }
  };

  const suggestions = generateMonthSuggestions();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Mês</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthName">Nome do Mês (MM-YYYY)</Label>
            <Input
              id="monthName"
              value={monthName}
              onChange={(e) => setMonthName(e.target.value)}
              placeholder="Ex: 01-2024"
              type="text"
            />
            <p className="text-xs text-gray-500">
              Use o formato MM-YYYY (exemplo: 01-2024 para Janeiro de 2024)
            </p>
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-2">
              <Label>Sugestões:</Label>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion.value}
                    variant="outline"
                    size="sm"
                    onClick={() => setMonthName(suggestion.value)}
                    className="text-xs"
                  >
                    {suggestion.display}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateMonth}
            disabled={isCreating || !monthName.trim()}
          >
            {isCreating ? "Criando..." : "Criar Mês"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewMonthDialog;
