
import { Student, Status } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/googleSheetsApi";

interface StudentCardProps {
  student: Student;
  onStatusChange: (studentId: string, newStatus: Status) => void;
}

const StudentCard = ({ student, onStatusChange }: StudentCardProps) => {
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

  return (
    <Card 
      className="mb-3 cursor-pointer hover:shadow-md transition-shadow animate-card-move"
      onClick={canAdvance ? handleMoveNext : undefined}
    >
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
      </CardContent>
    </Card>
  );
};

export default StudentCard;
