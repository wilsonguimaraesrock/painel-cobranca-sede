// Script para importar alunos de maio para junho
// Última alteração: Criação do script de importação

import { importStudentsFromPreviousMonth } from "../services/monthsService";

async function main() {
  try {
    console.log("Iniciando importação de alunos de maio para junho...");
    await importStudentsFromPreviousMonth("06-2024");
    console.log("Importação concluída com sucesso!");
  } catch (error) {
    console.error("Erro durante a importação:", error);
  }
}

main(); 