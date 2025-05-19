
import MonthSelector from "@/components/MonthSelector";

interface MonthSelectorWithCountProps {
  onMonthChange: (month: string) => void;
  studentsCount: number;
  loadingSource: "sheets" | "database" | "";
  loading: boolean;
}

const MonthSelectorWithCount = ({ 
  onMonthChange, 
  studentsCount, 
  loadingSource, 
  loading 
}: MonthSelectorWithCountProps) => {
  return (
    <div className="flex items-center flex-grow">
      <MonthSelector onMonthChange={onMonthChange} />
      {!loading && studentsCount > 0 && (
        <div className="text-sm text-gray-500 ml-4">
          {studentsCount} alunos encontrados
          {loadingSource && ` (${loadingSource === "database" ? "do banco de dados" : "da planilha e salvos no banco"})`}
        </div>
      )}
    </div>
  );
};

export default MonthSelectorWithCount;
