import { Student } from "@/types";

/**
 * Determina o mês de vencimento baseado na data de vencimento do aluno
 * @param dataVencimento - Data no formato DD/MM/YYYY ou DD/MM
 * @returns Mês no formato MM-YYYY
 */
export const getMesVencimento = (dataVencimento: string): string => {
  if (!dataVencimento || dataVencimento.trim() === "") {
    return "";
  }

  const partes = dataVencimento.split('/');
  
  if (partes.length === 3) {
    // Formato DD/MM/YYYY
    const mes = partes[1].padStart(2, '0');
    const ano = partes[2];
    return `${mes}-${ano}`;
  } else if (partes.length === 2) {
    // Formato DD/MM (assumir ano atual)
    const mes = partes[1].padStart(2, '0');
    const ano = new Date().getFullYear().toString();
    return `${mes}-${ano}`;
  }
  
  return "";
};

/**
 * Verifica se um aluno deve aparecer no mês especificado
 * @param student - Dados do aluno
 * @param targetMonth - Mês alvo no formato MM-YYYY
 * @returns true se o aluno deve aparecer no mês
 */
export const shouldStudentAppearInMonth = (student: Student, targetMonth: string): boolean => {
  // Se o aluno já está no mês alvo, deve aparecer
  if (student.mes === targetMonth) {
    return true;
  }

  // Se não tem data de vencimento, não deve aparecer em outros meses
  if (!student.dataVencimento || student.dataVencimento.trim() === "") {
    return false;
  }

  const mesVencimento = getMesVencimento(student.dataVencimento);
  
  // Se o mês de vencimento é o mês alvo, deve aparecer
  if (mesVencimento === targetMonth) {
    return true;
  }

  // Se o aluno está inadimplente e o mês de vencimento é anterior ao mês alvo,
  // deve aparecer no mês atual (mês alvo)
  if (student.status === "inadimplente" || student.status === "mensagem-enviada" || student.status === "resposta-recebida") {
    const [mesVenc, anoVenc] = mesVencimento.split('-');
    const [mesAlvo, anoAlvo] = targetMonth.split('-');
    
    if (mesVenc && anoVenc && mesAlvo && anoAlvo) {
      const dataVencimento = new Date(parseInt(anoVenc), parseInt(mesVenc) - 1, 1);
      const dataAlvo = new Date(parseInt(anoAlvo), parseInt(mesAlvo) - 1, 1);
      
      // Se a data de vencimento é anterior ou igual ao mês alvo, deve aparecer
      return dataVencimento <= dataAlvo;
    }
  }

  return false;
};

/**
 * Filtra alunos que devem aparecer no mês especificado
 * @param allStudents - Lista completa de alunos
 * @param targetMonth - Mês alvo no formato MM-YYYY
 * @returns Lista de alunos que devem aparecer no mês
 */
export const filterStudentsForMonth = (allStudents: Student[], targetMonth: string): Student[] => {
  return allStudents.filter(student => shouldStudentAppearInMonth(student, targetMonth));
};

/**
 * Obtém todos os meses em que um aluno deve aparecer
 * @param student - Dados do aluno
 * @returns Array de meses no formato MM-YYYY
 */
export const getMonthsForStudent = (student: Student): string[] => {
  const months: string[] = [];
  
  // Sempre incluir o mês onde o aluno foi criado
  if (student.mes) {
    months.push(student.mes);
  }
  
  // Se tem data de vencimento, incluir o mês de vencimento
  if (student.dataVencimento) {
    const mesVencimento = getMesVencimento(student.dataVencimento);
    if (mesVencimento && !months.includes(mesVencimento)) {
      months.push(mesVencimento);
    }
  }
  
  // Se está inadimplente, incluir o mês atual
  if (student.status === "inadimplente" || student.status === "mensagem-enviada" || student.status === "resposta-recebida") {
    const hoje = new Date();
    const mesAtual = `${(hoje.getMonth() + 1).toString().padStart(2, '0')}-${hoje.getFullYear()}`;
    if (!months.includes(mesAtual)) {
      months.push(mesAtual);
    }
  }
  
  return months.sort();
}; 