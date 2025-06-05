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
import { createNewMonthInDatabase, formatMonthDisplay, checkMonthExistsInDatabase, importStudentsFromPreviousMonth } from "@/services/monthsService";
import { supabase } from "@/integrations/supabase/client";

interface AddNewMonthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMonthAdded: (month: string) => void;
  existingMonths: string[];
}

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
    try {
      if (!monthName) {
        toast.error('Por favor, insira o nome do mês');
        return;
      }

      // Validar formato do mês (MM-YYYY)
      const monthRegex = /^(0[1-9]|1[0-2])-\d{4}$/;
      if (!monthRegex.test(monthName)) {
        toast.error('Formato inválido. Use MM-YYYY (ex: 06-2025)');
        return;
      }

      // Verificar se o mês já existe localmente
      const monthExists = existingMonths.some(m => m === monthName);
      if (monthExists) {
        toast.error('Este mês já existe');
        return;
      }

      // Verificar se é junho/25 e excluir se existir
      if (monthName === '06-2025') {
        // Excluir todos os registros de junho/25 em qualquer formato
        const { data: existingMonths } = await supabase
          .from('available_months')
          .select('month_value')
          .or("month_value.ilike.06-2025,month_value.ilike.%JUNHO%25,month_value.ilike.%junho%25");

        if (existingMonths && existingMonths.length > 0) {
          for (const month of existingMonths) {
            // Excluir alunos do mês
            await supabase
              .from('students')
              .delete()
              .eq('mes', month.month_value);

            // Excluir o mês
            await supabase
              .from('available_months')
              .delete()
              .eq('month_value', month.month_value);
          }
          toast.success('Todos os registros de junho/25 anteriores foram excluídos');
        }
      }

      // Criar o novo mês padronizado
      let displayName = monthName;
      if (monthName === '06-2025') displayName = 'JUNHO/25';
      const { error } = await supabase
        .from('available_months')
        .insert([{ 
          month_value: '06-2025',
          display_name: displayName,
          is_active: true
        }]);

      if (error) {
        console.error('Erro ao criar mês:', error);
        toast.error('Erro ao criar mês');
        return;
      }

      toast.success('Mês criado com sucesso!');
      onClose();
      onMonthAdded('06-2025');

      // Se for junho/25, importar alunos de maio/25
      if (monthName === '06-2025') {
        try {
          await importStudentsFromPreviousMonth('06-2025');
          toast.success('Alunos inadimplentes de maio importados para junho!');
        } catch (error) {
          console.error('Erro ao importar alunos:', error);
          toast.error('Erro ao importar alunos do mês anterior');
        }
      }
    } catch (error) {
      console.error('Erro ao criar mês:', error);
      toast.error('Erro ao criar mês');
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
