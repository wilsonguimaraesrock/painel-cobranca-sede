// Componente para gerenciar backups dos dados
// Última alteração: Criação do componente de gerenciamento de backups

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createLocalBackup, restoreLocalBackup, listAvailableBackups } from "@/services/backupService";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { checkDatabaseIntegrity, fixDatabaseProblems, checkSupabaseData } from "@/scripts/checkDatabase";

interface BackupManagerProps {
  mes: string;
  onRestore: (data: any[]) => void;
}

export default function BackupManager({ mes, onRestore }: BackupManagerProps) {
  const [backups, setBackups] = useState<{ timestamp: string; key: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      await createLocalBackup(mes);
      const availableBackups = listAvailableBackups(mes);
      setBackups(availableBackups);
      toast.success("Backup criado com sucesso");
    } catch (error) {
      console.error("Erro ao criar backup:", error);
      toast.error("Erro ao criar backup");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (key: string) => {
    try {
      setLoading(true);
      const data = await restoreLocalBackup(mes);
      onRestore(data);
      toast.success("Backup restaurado com sucesso");
    } catch (error) {
      console.error("Erro ao restaurar backup:", error);
      toast.error("Erro ao restaurar backup");
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = () => {
    const availableBackups = listAvailableBackups(mes);
    setBackups(availableBackups);
  };

  const handleCheckIntegrity = async () => {
    try {
      setLoading(true);
      await checkDatabaseIntegrity(mes);
    } catch (error) {
      console.error("Erro ao verificar integridade:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFixProblems = async () => {
    try {
      setLoading(true);
      await fixDatabaseProblems(mes);
    } catch (error) {
      console.error("Erro ao corrigir problemas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSupabaseData = async () => {
    try {
      setLoading(true);
      await checkSupabaseData(mes);
    } catch (error) {
      console.error("Erro ao verificar dados no Supabase:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gerenciador de Backups</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            onClick={handleCreateBackup}
            disabled={loading}
            className="w-full"
          >
            Criar Backup
          </Button>

          <Button
            onClick={loadBackups}
            variant="outline"
            disabled={loading}
            className="w-full"
          >
            Atualizar Lista
          </Button>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Manutenção do Banco de Dados</h3>
            <div className="space-y-2">
              <Button
                onClick={handleCheckSupabaseData}
                variant="outline"
                disabled={loading}
                className="w-full"
              >
                Verificar Dados no Supabase
              </Button>

              <Button
                onClick={handleCheckIntegrity}
                variant="outline"
                disabled={loading}
                className="w-full"
              >
                Verificar Integridade
              </Button>

              <Button
                onClick={handleFixProblems}
                variant="outline"
                disabled={loading}
                className="w-full"
              >
                Corrigir Problemas
              </Button>
            </div>
          </div>

          {backups.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Backups Disponíveis:</h3>
              {backups.map((backup) => (
                <div
                  key={backup.key}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span>
                    {format(new Date(backup.timestamp), "dd/MM/yyyy HH:mm:ss", {
                      locale: ptBR,
                    })}
                  </span>
                  <Button
                    onClick={() => handleRestoreBackup(backup.key)}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    Restaurar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 