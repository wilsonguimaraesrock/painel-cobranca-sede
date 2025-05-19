
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAvailableSheets } from "@/lib/googleSheetsApi";
import { toast } from "sonner";

interface MonthSelectorProps {
  onMonthChange: (month: string) => void;
}

const MonthSelector = ({ onMonthChange }: MonthSelectorProps) => {
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMonths = async () => {
      try {
        setLoading(true);
        const availableSheets = await getAvailableSheets();
        
        if (availableSheets.length > 0) {
          setMonths(availableSheets);
          // Selecione o mês mais recente (última aba)
          const mostRecentMonth = availableSheets[availableSheets.length - 1];
          setSelectedMonth(mostRecentMonth);
          onMonthChange(mostRecentMonth);
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

  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium">Selecione o mês:</label>
      <Select
        disabled={loading || months.length === 0}
        value={selectedMonth}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Selecionar mês" />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month} value={month}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MonthSelector;
