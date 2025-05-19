
export interface Student {
  id: string;
  nome: string;
  curso: string;
  valor: number;
  dataVencimento: string;
  diasAtraso: number;
  followUp: string;
  email: string;
  telefone: string;
  observacoes: string;
  status: Status;
}

export type Status = "inadimplente" | "mensagem-enviada" | "resposta-recebida" | "pagamento-feito";

export interface SheetData {
  range: string;
  majorDimension: string;
  values: string[][];
}

export interface DashboardMetrics {
  total: number;
  ate5dias: number;
  ate10dias: number;
  mais10dias: number;
}
