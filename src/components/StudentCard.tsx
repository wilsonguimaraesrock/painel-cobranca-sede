
import { Student, Status } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/googleSheetsApi";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StudentCardProps {
  student: Student;
  onStatusChange: (studentId: string, newStatus: Status) => void;
  onReturnToPrevious: (studentId: string) => void;
}

const StudentCard = ({ student, onStatusChange, onReturnToPrevious }: StudentCardProps) => {
  // Mapeia os status para os próximos status possíveis
  const nextStatusMap: Record<Status, Status> = {
    "inadimplente": "mensagem-enviada",
    "mensagem-enviada": "resposta-recebida",
    "resposta-recebida": "pagamento-feito",
    "pagamento-feito": "pagamento-feito", // Não tem próximo estado
  };
  
  const statusDisplay: Record<Status, string> = {
    "inadimplente": "Inadimplente",
    "mensagem-enviada": "Mensagem enviada",
    "resposta-recebida": "Resposta recebida",
    "pagamento-feito": "Pagamento realizado"
  };
  
  const statusColors: Record<Status, string> = {
    "inadimplente": "bg-kanban-overdue text-white",
    "mensagem-enviada": "bg-kanban-sent text-white",
    "resposta-recebida": "bg-kanban-replied text-white",
    "pagamento-feito": "bg-kanban-paid text-white"
  };

  // Verificar se pode avançar para o próximo status
  // Verifica se o campo follow up está preenchido
  const canAdvance = student.followUp.trim() !== "";
  
  const handleMoveNext = () => {
    if (!canAdvance) {
      return;
    }
    
    const nextStatus = nextStatusMap[student.status];
    if (nextStatus !== student.status) {
      onStatusChange(student.id, nextStatus);
    }
  };

  // Verificar se pode retornar para o status anterior
  const canReturn = student.status !== "inadimplente";
  
  const handleReturnToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o evento de clique do cartão seja acionado
    if (canReturn) {
      onReturnToPrevious(student.id);
    }
  };

  return (
    <Card 
      className="mb-3 cursor-pointer hover:shadow-md transition-shadow animate-card-move relative"
      onClick={canAdvance ? handleMoveNext : undefined}
    >
      {/* Botão para retornar ao quadro anterior */}
      {canReturn && (
        <Button
          variant="outline"
          size="sm"
          className="absolute -top-2 -left-2 rounded-full p-0 h-8 w-8 bg-white border-gray-300 shadow-sm z-10"
          onClick={handleReturnToPrevious}
          title="Retornar para o quadro anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      
      <CardHeader className="p-3 pb-1">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-bold truncate" title={student.nome}>
            {student.nome}
          </CardTitle>
          <Badge className={statusColors[student.status]}>
            {statusDisplay[student.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1 text-sm">
        <div className="grid grid-cols-2 gap-1">
          <div className="text-muted-foreground">Valor:</div>
          <div className="font-medium">{formatCurrency(student.valor)}</div>
          
          <div className="text-muted-foreground">Vencimento:</div>
          <div className="font-medium">{student.dataVencimento}</div>
          
          <div className="text-muted-foreground">Dias em atraso:</div>
          <div className="font-medium text-kanban-overdue">{student.diasAtraso} dias</div>
          
          <div className="text-muted-foreground">Follow up:</div>
          <div className={`font-medium ${!student.followUp ? 'text-destructive italic' : ''}`}>
            {student.followUp || "Pendente"}
          </div>
          
          {student.observacoes && (
            <>
              <div className="text-muted-foreground">Observações:</div>
              <div className="font-medium">{student.observacoes}</div>
            </>
          )}
        </div>
        
        {!canAdvance && student.status !== "pagamento-feito" && (
          <div className="mt-2 text-xs text-red-500">
            Preencha o campo "follow up" para mover este aluno.
          </div>
        )}
        
        {canAdvance && student.status !== "pagamento-feito" && (
          <div className="mt-2 text-xs text-blue-500 flex items-center justify-end">
            <span>Clique para avançar</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentCard;
