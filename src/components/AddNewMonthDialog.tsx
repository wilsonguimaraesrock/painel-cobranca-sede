
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
import { formatMonthDisplay, importStudentsFromPreviousMonth } from "@/services/monthsService";
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
      setIsCreating(true);
      
      if (!monthName) {
        toast.error('Por favor, insira o nome do mês');
        return;
      }

      // Validar formato do mês (MM-YYYY)
      const monthRegex = /^(0[1-9]|1[0-2])-\d{4}$/;
      if (!monthRegex.test(monthName)) {
        toast.error('Formato inválido. Use MM-YYYY (ex: 07-2025)');
        return;
      }

      // Verificar se o mês já existe localmente
      const monthExists = existingMonths.some(m => m === monthName);
      if (monthExists) {
        toast.error('Este mês já existe');
        return;
      }

      console.log(`Criando novo mês: ${monthName}`);
      
      // Verificar se o mês já existe no banco
      const { data: existingMonth, error: checkError } = await supabase
        .from('available_months')
        .select('month_value')
        .eq('month_value', monthName)
        .maybeSingle();

      if (checkError) {
        console.error('Erro ao verificar mês existente:', checkError);
        throw checkError;
      }

      if (existingMonth) {
        toast.error('Este mês já existe no banco de dados');
        return;
      }

      // Criar o novo mês
      const displayName = formatMonthDisplay(monthName);
      const { error: insertError } = await supabase
        .from('available_months')
        .insert([{ 
          month_value: monthName,
          display_name: displayName,
          is_active: true
        }]);

      if (insertError) {
        console.error('Erro ao criar mês:', insertError);
        if (insertError.code === "23505") {
          toast.error('Este mês já existe no banco de dados');
        } else {
          toast.error('Erro ao criar mês');
        }
        return;
      }

      console.log(`Mês ${monthName} criado com sucesso`);
      toast.success('Mês criado com sucesso!');
      
      // Tentar importar alunos do mês anterior
      try {
        console.log(`Tentando importar alunos inadimplentes para o mês: ${monthName}`);
        await importStudentsFromPreviousMonth(monthName);
        toast.success('Alunos inadimplentes do mês anterior importados com sucesso!');
      } catch (importError) {
        console.error('Erro ao importar alunos:', importError);
        toast.warning('Mês criado, mas houve erro ao importar alunos do mês anterior');
      }
      
      onMonthAdded(monthName);
      onClose();
      setMonthName("");
      
    } catch (error) {
      console.error('Erro ao criar mês:', error);
      toast.error('Erro ao criar mês');
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
              placeholder="Ex: 07-2025"
              type="text"
            />
            <p className="text-xs text-gray-500">
              Use o formato MM-YYYY (exemplo: 07-2025 para Julho de 2025)
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
