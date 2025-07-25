import { useState, useEffect } from "react";
import { Student, FollowUp } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import FollowUpManager from "./FollowUpManager";
import { Lock, Edit3 } from "lucide-react";

interface StudentDetailsDialogV2Props {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedStudent: Student) => void;
}

const StudentDetailsDialogV2 = ({ 
  student, 
  isOpen, 
  onClose, 
  onUpdate 
}: StudentDetailsDialogV2Props) => {
  const { username } = useAuth();
  const [observacoes, setObservacoes] = useState(student.observacoes || "");
  const [dataPagamento, setDataPagamento] = useState(student.dataPagamento || "");
  const [isDateRequired, setIsDateRequired] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUp[]>(student.followUps || []);
  const [isEditingObservacoes, setIsEditingObservacoes] = useState(false);

  // Verificar se o usuário atual pode editar as observações
  const canEditObservacoes = !student.createdBy || student.createdBy === username;

  // Reset form when student changes
  useEffect(() => {
    setObservacoes(student.observacoes || "");
    setDataPagamento(student.dataPagamento || "");
    setFollowUps(student.followUps || []);
    setIsEditingObservacoes(false);
    
    // Date is required when current status is "resposta-recebida" and we want to move to "pagamento-feito"
    setIsDateRequired(student.status === "resposta-recebida");
  }, [student]);

  const handleSave = () => {
    // Update the student object with the new values
    const updatedStudent = {
      ...student,
      observacoes,
      dataPagamento,
      followUps
    };
    
    onUpdate(updatedStudent);
    onClose();
  };

  const handleFollowUpAdded = (newFollowUp: FollowUp) => {
    setFollowUps(prev => [...prev, newFollowUp]);
  };

  const handleFollowUpUpdated = (updatedFollowUp: FollowUp) => {
    setFollowUps(prev => 
      prev.map(f => f.id === updatedFollowUp.id ? updatedFollowUp : f)
    );
  };

  const handleFollowUpDeleted = (followUpId: string) => {
    setFollowUps(prev => prev.filter(f => f.id !== followUpId));
  };

  const saveObservacoes = () => {
    setIsEditingObservacoes(false);
    // As observações são salvas localmente e serão enviadas no handleSave
  };

  const cancelEditObservacoes = () => {
    setObservacoes(student.observacoes || "");
    setIsEditingObservacoes(false);
  };

  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Format date from YYYY-MM-DD to DD/MM/YYYY
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    // If already in DD/MM/YYYY format, return as is
    if (dateString.includes('/')) return dateString;
    
    // Convert from YYYY-MM-DD to DD/MM/YYYY
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Get status display name
  const getStatusDisplay = (status: string): string => {
    const statusDisplayMap: Record<string, string> = {
      "inadimplente": "Inadimplente",
      "mensagem-enviada": "Mensagem Enviada",
      "resposta-recebida": "Resposta Recebida",
      "pagamento-feito": "Pagamento Realizado"
    };
    
    return statusDisplayMap[status] || status;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Aluno</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {/* Informações básicas do aluno */}
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-semibold text-lg">{student.nome}</h3>
              <p className="text-sm text-gray-500">{formatCurrency(student.valor)}</p>
              <div className="flex gap-2 text-xs text-gray-400">
                <span>Vencimento: {student.dataVencimento}</span>
                <span>Mês: {student.mes}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Badge className="text-xs">
                  {getStatusDisplay(student.status)}
                </Badge>
                {student.createdBy && (
                  <span className="text-xs text-gray-500">
                    Criado por: {student.createdBy}
                  </span>
                )}
              </div>
              {student.diasAtraso > 0 && student.status !== "pagamento-feito" && (
                <p className="text-xs font-medium text-red-500 mt-1">
                  {student.diasAtraso} dias em atraso
                </p>
              )}
              {student.status === "pagamento-feito" && student.dataPagamento && (
                <p className="text-xs font-medium text-green-600 mt-1">
                  Pagamento realizado em: {formatDate(student.dataPagamento)}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Tabs para organizar o conteúdo */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Dados & Observações</TabsTrigger>
              <TabsTrigger value="followups">Follow-ups</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Observações */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="observacoes">Observações Gerais</Label>
                  {!canEditObservacoes && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Lock className="h-3 w-3" />
                      Apenas o criador pode editar
                    </div>
                  )}
                  {canEditObservacoes && !isEditingObservacoes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingObservacoes(true)}
                      className="h-6 px-2"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {isEditingObservacoes && canEditObservacoes ? (
                  <div className="space-y-2">
                    <Textarea
                      id="observacoes"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={3}
                      placeholder="Adicione observações gerais aqui..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveObservacoes}>
                        Salvar
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelEditObservacoes}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[80px] p-3 border rounded-md bg-gray-50">
                    {observacoes ? (
                      <p className="text-sm whitespace-pre-wrap">{observacoes}</p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Nenhuma observação registrada
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Data de Pagamento */}
              <div className="space-y-2">
                <Label htmlFor="dataPagamento">
                  Data de Pagamento
                  {isDateRequired && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id="dataPagamento"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  type="text"
                  className={isDateRequired && !dataPagamento ? "border-red-500" : ""}
                />
                {isDateRequired && (
                  <p className="text-xs text-amber-600">
                    A data de pagamento é obrigatória para mover o aluno para "Pagamento Realizado"
                  </p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="followups" className="mt-4">
              <FollowUpManager
                studentId={student.id}
                currentUser={username || "Usuário"}
                followUps={followUps}
                onFollowUpAdded={handleFollowUpAdded}
                onFollowUpUpdated={handleFollowUpUpdated}
                onFollowUpDeleted={handleFollowUpDeleted}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetailsDialogV2; 