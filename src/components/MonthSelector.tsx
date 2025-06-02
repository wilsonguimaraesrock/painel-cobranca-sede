
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAvailableSheets } from "@/lib/googleSheetsApi";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AddNewMonthDialog from "./AddNewMonthDialog";

interface MonthSelectorProps {
  onMonthChange: (month: string) => void;
}

// Função para converter MM-YYYY para formato por extenso
const formatMonthDisplay = (monthValue: string): string => {
  // Validar se o valor existe e está no formato correto
  if (!monthValue || typeof monthValue !== 'string') {
    console.warn('Invalid month value:', monthValue);
    return monthValue || '';
  }

  const parts = monthValue.split('-');
  if (parts.length !== 2) {
    console.warn('Month value not in MM-YYYY format:', monthValue);
    return monthValue;
  }

  const [month, year] = parts;
  
  // Validar se month e year existem
  if (!month || !year) {
    console.warn('Invalid month or year in:', monthValue);
    return monthValue;
  }

  const monthNames = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];
  
  const monthIndex = parseInt(month) - 1;
  
  // Validar se o índice do mês é válido
  if (monthIndex < 0 || monthIndex >= 12 || isNaN(monthIndex)) {
    console.warn('Invalid month index:', month, 'in value:', monthValue);
    return monthValue;
  }
  
  const shortYear = year.length >= 2 ? year.slice(-2) : year;
  
  return `${monthNames[monthIndex]}/${shortYear}`;
};

const MonthSelector = ({ onMonthChange }: MonthSelectorProps) => {
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddMonthDialogOpen, setIsAddMonthDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchMonths = async () => {
      try {
        setLoading(true);
        const availableSheets = await getAvailableSheets();
        
        if (availableSheets.length > 0) {
          setMonths(availableSheets);
          // Selecione a primeira aba (mais recente, atual)
          const currentMonth = availableSheets[0]; 
          setSelectedMonth(currentMonth);
          onMonthChange(currentMonth);
        }
      } catch (error) {
        console.error("Erro ao buscar meses:", error);
        toast.error("Não foi possível carregar os meses disponíveis");
      } finally {
        setLoading(false);
      }
    };

    fetchMonths();
  }, [onMonthChange]);

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    onMonthChange(value);
  };

  const handleNewMonthAdded = (newMonth: string) => {
    // Adicionar o novo mês à lista e selecioná-lo
    setMonths(prev => [newMonth, ...prev]);
    setSelectedMonth(newMonth);
    onMonthChange(newMonth);
    setIsAddMonthDialogOpen(false);
    toast.success(`Novo mês "${formatMonthDisplay(newMonth)}" criado com sucesso!`);
  };

  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium">Selecione o mês:</label>
      <Select
        disabled={loading || months.length === 0}
        value={selectedMonth}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Selecionar mês" />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month} value={month}>
              {formatMonthDisplay(month)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        onClick={() => setIsAddMonthDialogOpen(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
      >
        <Plus className="h-4 w-4" />
        Novo Mês
      </Button>

      <AddNewMonthDialog
        isOpen={isAddMonthDialogOpen}
        onClose={() => setIsAddMonthDialogOpen(false)}
        onMonthAdded={handleNewMonthAdded}
        existingMonths={months}
      />
    </div>
  );
};

export default MonthSelector;
