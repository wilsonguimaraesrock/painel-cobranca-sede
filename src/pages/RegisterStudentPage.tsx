
import { useEffect, useState } from "react";
import StudentRegistrationForm from "@/components/StudentRegistrationForm";
import MonthSelector from "@/components/MonthSelector";
import { getAvailableSheets } from "@/lib/googleSheetsApi";
import UserStatus from "@/components/UserStatus";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function RegisterStudentPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto p-4">
      <div className="w-full bg-primary text-primary-foreground py-4 mb-4 rounded-md shadow-md">
        <div className="flex justify-between items-center px-4">
          <h1 className="text-3xl font-bold">CRM de Cobrança - Rockfeller Navegantes</h1>
          <UserStatus />
        </div>
      </div>
      
      <div className="flex items-center mb-6">
        <Button 
          variant="outline"
          onClick={() => navigate("/")}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <MonthSelector onMonthChange={setSelectedMonth} />
      </div>
      
      {!selectedMonth ? (
        <div className="text-center text-gray-500 my-8">
          Selecione um mês antes de cadastrar um aluno
        </div>
      ) : (
        <StudentRegistrationForm selectedMonth={selectedMonth} />
      )}
    </div>
  );
}
