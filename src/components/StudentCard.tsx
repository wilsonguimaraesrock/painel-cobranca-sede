import { Student, Status, StatusHistory } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/googleSheetsApi";
import { ChevronLeft, ChevronRight, History, Eye, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface StudentCardProps {
  student: Student;
  onStatusChange: (studentId: string, newStatus: Status) => void;
  onReturnToPrevious: (studentId: string) => void;
  onStudentUpdate?: (updatedStudent: Student) => void;
}

const StudentCard = ({ student, onStatusChange, onReturnToPrevious, onStudentUpdate }: StudentCardProps) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editedStudent, setEditedStudent] = useState<Student>({...student});
  
  // Atualizar o estudante editado sempre que as props mudarem
  useEffect(() => {
    setEditedStudent({...student});
  }, [student]);
  
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
  const canAdvance = student.followUp?.trim() !== "";
  
  const handleMoveNext = () => {
    if (!canAdvance) {
      toast.error("O campo 'Follow Up' precisa ser preenchido");
      return;
    }
    
    const nextStatus = nextStatusMap[student.status];
    if (nextStatus !== student.status) {
      console.log(`Movendo aluno ${student.id} para ${nextStatus}`);
      onStatusChange(student.id, nextStatus);
    }
  };

  // Verificar se pode retornar para o status anterior
  const canReturn = student.status !== "inadimplente";
  
  const handleReturnToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o evento de clique do cartão seja acionado
    if (canReturn) {
      console.log(`Retornando aluno ${student.id} para status anterior`);
      onReturnToPrevious(student.id);
    }
  };
  
  // Truncate observações text if it's too long
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  
  // Formatar data para exibição
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // Função para atualizar os dados do aluno
  const handleUpdateStudentData = () => {
    if (onStudentUpdate) {
      console.log(`Atualizando dados do aluno ${student.id} via detalhes`);
      onStudentUpdate(editedStudent);
      toast.success("Dados do aluno atualizados");
      setIsDetailsOpen(false);
    }
  };

  // Função para registrar contato
  const handleRegisterContact = (type: 'primeiro' | 'ultimo') => {
    const now = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());
    
    const updatedStudent = {...editedStudent};
    
    if (type === 'primeiro' && !updatedStudent.primeiroContato) {
      updatedStudent.primeiroContato = now;
    } else if (type === 'ultimo') {
      updatedStudent.ultimoContato = now;
    }
    
    setEditedStudent(updatedStudent);
  };

  const hasHistory = student.statusHistory && student.statusHistory.length > 0;

  // Handle card click - we want to either show details or advance status
  const handleCardClick = () => {
    setEditedStudent({...student});
    setIsDetailsOpen(true);
  };

  return (
    <>
      <Card 
        className="mb-3 cursor-pointer hover:shadow-md transition-shadow animate-card-move relative"
        onClick={handleCardClick}
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
        
        {/* Botão para mostrar histórico */}
        {hasHistory && (
          <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="absolute -top-2 -right-2 rounded-full p-0 h-8 w-8 bg-white border-gray-300 shadow-sm z-10"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                title="Ver histórico de alterações"
              >
                <History className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]" onClick={e => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>Histórico de alterações - {student.nome}</DialogTitle>
              </DialogHeader>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>De</TableHead>
                    <TableHead>Para</TableHead>
                    <TableHead>Alterado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.statusHistory && student.statusHistory.map((history, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(history.changedAt)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[history.oldStatus]}>
                          {statusDisplay[history.oldStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[history.newStatus]}>
                          {statusDisplay[history.newStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>{history.changedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="font-medium truncate" style={{ maxWidth: "120px" }}>
                      {truncateText(student.observacoes, 15)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{student.observacoes}</p>
                  </TooltipContent>
                </Tooltip>
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
              <span>Clique para detalhes</span>
              <Eye className="h-4 w-4 ml-1" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalhes do aluno */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{student.nome}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <Badge className={`${statusColors[student.status]} text-base py-1 px-3`}>
                {statusDisplay[student.status]}
              </Badge>
              <span className="font-bold text-xl">{formatCurrency(student.valor)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <div className="text-sm text-muted-foreground">Vencimento</div>
                <div className="font-medium">{student.dataVencimento}</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Dias em atraso</div>
                <div className="font-medium text-kanban-overdue">{student.diasAtraso} dias</div>
              </div>
              
              <div className="relative">
                <div className="text-sm text-muted-foreground">Primeiro contato</div>
                <div className="flex items-center">
                  <div className="font-medium flex-1">
                    {editedStudent.primeiroContato || "Não registrado"}
                  </div>
                  {!editedStudent.primeiroContato && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRegisterContact('primeiro')}
                      title="Registrar primeiro contato"
                      className="ml-2"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Último contato</div>
                <div className="flex items-center">
                  <div className="font-medium flex-1">
                    {editedStudent.ultimoContato || "Não registrado"}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleRegisterContact('ultimo')}
                    title="Registrar último contato"
                    className="ml-2"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="text-sm text-muted-foreground">Follow up</div>
                <Input 
                  value={editedStudent.followUp || ""} 
                  onChange={(e) => setEditedStudent({...editedStudent, followUp: e.target.value})}
                  placeholder="Adicione informações de follow up"
                />
              </div>
              
              {student.observacoes && (
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Observações</div>
                  <Input 
                    value={editedStudent.observacoes || ""} 
                    onChange={(e) => setEditedStudent({...editedStudent, observacoes: e.target.value})}
                    placeholder="Adicione observações"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-between pt-4 gap-4">
              <Button 
                variant="outline" 
                onClick={() => setIsDetailsOpen(false)}
                className="w-1/2"
              >
                Cancelar
              </Button>
              
              <Button 
                onClick={handleUpdateStudentData}
                className="w-1/2"
              >
                Salvar alterações
              </Button>
            </div>
            
            {canAdvance && student.status !== "pagamento-feito" && (
              <div className="pt-2">
                <Button 
                  className="w-full" 
                  onClick={() => {
                    handleMoveNext();
                    setIsDetailsOpen(false);
                  }}
                >
                  Avançar para {statusDisplay[nextStatusMap[student.status]]}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StudentCard;
