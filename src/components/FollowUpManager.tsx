import { useState, useEffect } from "react";
import { FollowUp } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { addFollowUp, updateFollowUp, deleteFollowUp } from "@/services/supabaseService";

interface FollowUpManagerProps {
  studentId: string;
  currentUser: string;
  followUps: FollowUp[];
  onFollowUpAdded: (followUp: FollowUp) => void;
  onFollowUpUpdated: (followUp: FollowUp) => void;
  onFollowUpDeleted: (followUpId: string) => void;
}

const FollowUpManager = ({
  studentId,
  currentUser,
  followUps,
  onFollowUpAdded,
  onFollowUpUpdated,
  onFollowUpDeleted
}: FollowUpManagerProps) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFollowUpContent, setNewFollowUpContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Usando as funções reais do supabaseService

  const handleAddFollowUp = async () => {
    if (!newFollowUpContent.trim()) {
      toast.error("Por favor, digite o conteúdo do follow-up");
      return;
    }

    setIsSubmitting(true);
    try {
      const followUp = await addFollowUp(studentId, newFollowUpContent, currentUser);
      
      if (followUp) {
        onFollowUpAdded(followUp);
        setNewFollowUpContent("");
        setIsAddingNew(false);
      }
    } catch (error) {
      console.error("Erro ao adicionar follow-up:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFollowUp = async (followUpId: string) => {
    if (!editContent.trim()) {
      toast.error("Por favor, digite o conteúdo do follow-up");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await updateFollowUp(followUpId, editContent, currentUser);
      
      if (success) {
        const updatedFollowUp = followUps.find(f => f.id === followUpId);
        if (updatedFollowUp) {
          onFollowUpUpdated({
            ...updatedFollowUp,
            content: editContent,
            updatedAt: new Date()
          });
        }
        setEditingId(null);
        setEditContent("");
      }
    } catch (error) {
      console.error("Erro ao atualizar follow-up:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFollowUp = async (followUpId: string) => {
    if (!confirm("Tem certeza que deseja excluir este follow-up?")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await deleteFollowUp(followUpId, currentUser);
      
      if (success) {
        onFollowUpDeleted(followUpId);
      }
    } catch (error) {
      console.error("Erro ao excluir follow-up:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (followUp: FollowUp) => {
    setEditingId(followUp.id);
    setEditContent(followUp.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const formatDateTime = (date: Date) => {
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="space-y-4">
      {/* Header com botão para adicionar */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Follow-ups</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingNew(true)}
          disabled={isAddingNew || isSubmitting}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Follow-up
        </Button>
      </div>

      {/* Formulário para adicionar novo follow-up */}
      {isAddingNew && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Novo Follow-up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={newFollowUpContent}
              onChange={(e) => setNewFollowUpContent(e.target.value)}
              placeholder="Digite aqui o acompanhamento realizado..."
              rows={3}
              disabled={isSubmitting}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddFollowUp}
                disabled={isSubmitting || !newFollowUpContent.trim()}
              >
                <Check className="h-4 w-4 mr-1" />
                Salvar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddingNew(false);
                  setNewFollowUpContent("");
                }}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de follow-ups */}
      <div className="space-y-3">
        {followUps.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            Nenhum follow-up registrado ainda.
            <br />
            Clique em "Adicionar Follow-up" para começar.
          </div>
        ) : (
          followUps.map((followUp, index) => (
            <Card key={followUp.id} className="relative">
              <CardContent className="pt-4">
                {/* Cabeçalho do follow-up */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      #{followUps.length - index}
                    </Badge>
                    <span className="text-xs text-gray-600">
                      por {followUp.createdBy}
                    </span>
                  </div>
                  
                  {/* Botões de ação - apenas para o criador */}
                  {followUp.createdBy === currentUser && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(followUp)}
                        disabled={isSubmitting || editingId !== null}
                        className="h-6 px-2"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFollowUp(followUp.id)}
                        disabled={isSubmitting}
                        className="h-6 px-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Conteúdo do follow-up */}
                {editingId === followUp.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      disabled={isSubmitting}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditFollowUp(followUp.id)}
                        disabled={isSubmitting || !editContent.trim()}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Salvar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEdit}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm whitespace-pre-wrap mb-2">
                      {followUp.content}
                    </p>
                    <div className="text-xs text-gray-500">
                      {formatDateTime(followUp.createdAt)}
                      {followUp.updatedAt > followUp.createdAt && (
                        <span className="ml-2">(editado)</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FollowUpManager; 