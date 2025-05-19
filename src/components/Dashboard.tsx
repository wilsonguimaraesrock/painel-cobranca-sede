
import { Student, DashboardMetrics } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/googleSheetsApi";

interface DashboardProps {
  students: Student[];
}

const Dashboard = ({ students }: DashboardProps) => {
  // Calcular métricas
  const metrics: DashboardMetrics = {
    total: 0,
    ate5dias: 0,
    ate10dias: 0,
    mais10dias: 0
  };
  
  // Valor total
  let valorTotal = 0;
  
  students.forEach(student => {
    if (student.status === "inadimplente" || student.status === "mensagem-enviada" || student.status === "resposta-recebida") {
      metrics.total++;
      valorTotal += student.valor;
      
      if (student.diasAtraso <= 5) {
        metrics.ate5dias++;
      } else if (student.diasAtraso <= 10) {
        metrics.ate10dias++;
      } else {
        metrics.mais10dias++;
      }
    }
  });
  
  // Cards para o dashboard
  const dashboardCards = [
    {
      title: "Total Inadimplentes",
      value: metrics.total,
      description: `Valor total: ${formatCurrency(valorTotal)}`,
      color: "bg-gradient-to-r from-blue-500 to-blue-600"
    },
    {
      title: "Atraso até 5 dias",
      value: metrics.ate5dias,
      description: `${((metrics.ate5dias / metrics.total) * 100).toFixed(1)}% do total`,
      color: "bg-gradient-to-r from-yellow-400 to-yellow-500"
    },
    {
      title: "Atraso até 10 dias",
      value: metrics.ate10dias,
      description: `${((metrics.ate10dias / metrics.total) * 100).toFixed(1)}% do total`,
      color: "bg-gradient-to-r from-orange-500 to-orange-600"
    },
    {
      title: "Atraso > 10 dias",
      value: metrics.mais10dias,
      description: `${((metrics.mais10dias / metrics.total) * 100).toFixed(1)}% do total`,
      color: "bg-gradient-to-r from-red-500 to-red-600"
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Dashboard de Cobrança</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardCards.map((card, index) => (
          <Card key={index} className={`dashboard-card ${card.color} text-white shadow-lg`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="text-sm opacity-80">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
