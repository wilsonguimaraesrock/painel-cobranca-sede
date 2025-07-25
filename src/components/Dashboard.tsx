
import { Student, DashboardMetrics } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/googleSheetsApi";
import { Button } from "@/components/ui/button";
import { DollarSign, Filter, BadgeCheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardProps {
  students: Student[];
  onFilterChange: (filter: string | null) => void;
  activeFilter: string | null;
}

const Dashboard = ({ students, onFilterChange, activeFilter }: DashboardProps) => {
  // Calcular métricas
  const metrics: DashboardMetrics = {
    total: 0,
    ate5dias: 0,
    ate10dias: 0,
    mais10dias: 0,
    pagamentoFeito: 0
  };
  
  // Valores totais por categoria
  let valorTotal = 0;
  let valorAte5dias = 0;
  let valorAte10dias = 0;
  let valorMais10dias = 0;
  let valorPagamentoFeito = 0;
  
  students.forEach(student => {
    if (student.status === "pagamento-feito") {
      metrics.pagamentoFeito++;
      valorPagamentoFeito += student.valor;
    }

    if (student.status === "inadimplente" || student.status === "mensagem-enviada" || student.status === "resposta-recebida") {
      metrics.total++;
      valorTotal += student.valor;
      
      if (student.diasAtraso <= 5) {
        metrics.ate5dias++;
        valorAte5dias += student.valor;
      } else if (student.diasAtraso <= 10) {
        metrics.ate10dias++;
        valorAte10dias += student.valor;
      } else {
        metrics.mais10dias++;
        valorMais10dias += student.valor;
      }
    }
  });
  
  // Calculate total number of students for percentage
  const totalStudents = students.length;
  const pagamentoFeitoPercentage = totalStudents > 0 
    ? ((metrics.pagamentoFeito / totalStudents) * 100).toFixed(1) 
    : "0.0";
  
  // Calculate total in default (all cards except "pagamento-feito")
  const totalInadimplencia = valorTotal;
  
  // Cards para o dashboard
  const dashboardCards = [
    {
      id: "all",
      title: "Total Inadimplentes",
      value: metrics.total,
      monetary: valorTotal,
      description: `${formatCurrency(valorTotal)}`,
      color: "bg-gradient-to-r from-blue-500 to-blue-600"
    },
    {
      id: "ate5dias",
      title: "Atraso até 5 dias",
      value: metrics.ate5dias,
      monetary: valorAte5dias,
      description: `${((metrics.ate5dias / metrics.total) * 100).toFixed(1)}% - ${formatCurrency(valorAte5dias)}`,
      color: "bg-gradient-to-r from-yellow-400 to-yellow-500"
    },
    {
      id: "ate10dias",
      title: "Atraso até 10 dias",
      value: metrics.ate10dias,
      monetary: valorAte10dias,
      description: `${((metrics.ate10dias / metrics.total) * 100).toFixed(1)}% - ${formatCurrency(valorAte10dias)}`,
      color: "bg-gradient-to-r from-orange-500 to-orange-600"
    },
    {
      id: "mais10dias",
      title: "Atraso > 10 dias",
      value: metrics.mais10dias,
      monetary: valorMais10dias,
      description: `${((metrics.mais10dias / metrics.total) * 100).toFixed(1)}% - ${formatCurrency(valorMais10dias)}`,
      color: "bg-gradient-to-r from-red-500 to-red-600"
    },
    {
      id: "pagamento-feito",
      title: "Pagamento Realizado",
      value: metrics.pagamentoFeito,
      monetary: valorPagamentoFeito,
      description: `${pagamentoFeitoPercentage}% - ${formatCurrency(valorPagamentoFeito)}`,
      color: "bg-gradient-to-r from-green-500 to-green-600"
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Dashboard de Cobrança</h2>
        <div className="flex items-center gap-2">
          {activeFilter && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onFilterChange(null)}
              className="flex items-center gap-1"
            >
              <Filter size={14} />
              Mostrar Todos
            </Button>
          )}
          {activeFilter && (
            <Badge variant="secondary" className="bg-primary/10">
              Filtro ativo: {dashboardCards.find(c => c.id === activeFilter)?.title || 'Todos'}
            </Badge>
          )}
        </div>
      </div>
      {/* 📱 LAYOUT RESPONSIVO - Otimizado em 18/01/2025
          Mobile: 2 colunas (antes era 1) - Melhor aproveitamento do espaço
          Tablet: 2 colunas (mantido)
          Desktop: 5 colunas (mantido) */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {dashboardCards.map((card) => (
          <Card 
            key={card.id} 
            className={`dashboard-card ${card.color} text-white shadow-lg hover:shadow-xl transition-all cursor-pointer ${activeFilter === card.id ? 'ring-4 ring-white/50' : ''}`} 
            onClick={() => onFilterChange(card.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-lg flex items-center justify-between">
                <span className="leading-tight">{card.title}</span>
                <DollarSign size={16} className="opacity-80 flex-shrink-0" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-3xl font-bold">{card.value}</p>
              <p className="text-xs md:text-sm opacity-80 leading-tight">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
