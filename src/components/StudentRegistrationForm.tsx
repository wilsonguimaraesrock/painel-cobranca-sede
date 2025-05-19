
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Student, Status } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

// Schema para validar os dados do formulário
const studentSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  valor: z.string().min(1, { message: "Valor é obrigatório" }),
  dataVencimento: z.string().min(1, { message: "Data de vencimento é obrigatória" }),
  curso: z.string().optional(),
  primeiroContato: z.string().optional(),
  ultimoContato: z.string().optional(), 
  dataPagamento: z.string().optional(),
  observacoes: z.string().optional(),
  dataFollowUp: z.string().optional(),
  email: z.string().email({ message: "E-mail inválido" }).optional().or(z.literal("")),
  telefone: z.string().optional(),
  diasAtraso: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentRegistrationFormProps {
  selectedMonth: string;
}

export default function StudentRegistrationForm({ selectedMonth }: StudentRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      nome: "",
      valor: "",
      dataVencimento: "",
      curso: "",
      primeiroContato: "",
      ultimoContato: "",
      dataPagamento: "",
      observacoes: "",
      dataFollowUp: "",
      email: "",
      telefone: "",
      diasAtraso: "",
    }
  });

  async function onSubmit(values: StudentFormValues) {
    if (!selectedMonth) {
      toast.error("Selecione um mês antes de cadastrar um aluno");
      return;
    }

    setIsSubmitting(true);

    try {
      // Converter o valor para número
      const valorNumerico = parseFloat(values.valor.replace(/[^\d,.]/g, "").replace(",", "."));
      
      // Calcular dias de atraso (usar o valor informado ou calcular)
      let diasAtraso = parseInt(values.diasAtraso || "0");
      if (isNaN(diasAtraso) && values.dataVencimento) {
        const partesData = values.dataVencimento.split('/');
        
        if (partesData.length >= 2) {
          const dia = parseInt(partesData[0]);
          const mes = parseInt(partesData[1]) - 1; // 0-based em JS
          const ano = partesData.length === 3 ? parseInt(partesData[2]) : new Date().getFullYear();
          
          const dataVencimento = new Date(ano, mes, dia);
          const hoje = new Date();
          
          const diff = hoje.getTime() - dataVencimento.getTime();
          diasAtraso = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (diasAtraso < 0) diasAtraso = 0;
        }
      }

      // Criar o objeto do aluno com ID único
      const newStudent: Student = {
        id: uuidv4(),
        nome: values.nome,
        curso: values.curso || "",
        valor: valorNumerico,
        dataVencimento: values.dataVencimento,
        diasAtraso: diasAtraso,
        followUp: values.dataFollowUp || "",
        email: values.email || "",
        telefone: values.telefone || "",
        observacoes: values.observacoes || "",
        status: "inadimplente" as Status,
        statusHistory: [],
        primeiroContato: values.primeiroContato || "",
        ultimoContato: values.ultimoContato || "",
        mes: selectedMonth
      };

      // Salvar no banco de dados
      const { error } = await supabase
        .from('students')
        .insert({
          id: newStudent.id,
          nome: newStudent.nome,
          curso: newStudent.curso,
          valor: newStudent.valor,
          data_vencimento: newStudent.dataVencimento,
          dias_atraso: newStudent.diasAtraso,
          follow_up: newStudent.followUp,
          email: newStudent.email,
          telefone: newStudent.telefone,
          observacoes: newStudent.observacoes,
          status: newStudent.status,
          primeiro_contato: newStudent.primeiroContato,
          ultimo_contato: newStudent.ultimoContato,
          mes: newStudent.mes
        });

      if (error) {
        console.error("Erro ao cadastrar aluno:", error);
        toast.error("Erro ao cadastrar aluno", {
          description: error.message
        });
        return;
      }

      toast.success("Aluno cadastrado com sucesso");
      form.reset();
      
      // Redirecionar para a página principal
      navigate("/");
      
    } catch (error) {
      console.error("Erro ao processar o formulário:", error);
      toast.error("Erro ao processar o formulário");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helper para formatar como moeda
  const formatCurrency = (value: string) => {
    const onlyNumbers = value.replace(/[^\d]/g, "");
    
    if (!onlyNumbers) return "";
    
    const number = parseInt(onlyNumbers, 10) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(number);
  };

  // Helper para formatar data
  const formatDate = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    
    if (cleanValue.length <= 2) {
      return cleanValue;
    } else if (cleanValue.length <= 4) {
      return `${cleanValue.slice(0, 2)}/${cleanValue.slice(2)}`;
    } else {
      return `${cleanValue.slice(0, 2)}/${cleanValue.slice(2, 4)}/${cleanValue.slice(4, 8)}`;
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Cadastrar Novo Aluno Inadimplente</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NOME</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome completo do aluno" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="valor"
              render={({ field: { onChange, ...rest } }) => (
                <FormItem>
                  <FormLabel>VALOR</FormLabel>
                  <FormControl>
                    <Input 
                      {...rest} 
                      placeholder="R$ 0,00" 
                      onChange={(e) => {
                        const formattedValue = formatCurrency(e.target.value);
                        onChange(formattedValue);
                      }} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataVencimento"
                render={({ field: { onChange, ...rest } }) => (
                  <FormItem>
                    <FormLabel>VENCIMEN.</FormLabel>
                    <FormControl>
                      <Input 
                        {...rest} 
                        placeholder="DD/MM/AAAA" 
                        onChange={(e) => {
                          const formattedValue = formatDate(e.target.value);
                          onChange(formattedValue);
                        }} 
                        maxLength={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="diasAtraso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias de Atraso</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="0" 
                        type="number"
                        min="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primeiroContato"
                render={({ field: { onChange, ...rest } }) => (
                  <FormItem>
                    <FormLabel>PRIMEIRO CONTATO</FormLabel>
                    <FormControl>
                      <Input 
                        {...rest} 
                        placeholder="DD/MM/AAAA" 
                        onChange={(e) => {
                          const formattedValue = formatDate(e.target.value);
                          onChange(formattedValue);
                        }} 
                        maxLength={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ultimoContato"
                render={({ field: { onChange, ...rest } }) => (
                  <FormItem>
                    <FormLabel>ÚLTIMO CONTATO</FormLabel>
                    <FormControl>
                      <Input 
                        {...rest} 
                        placeholder="DD/MM/AAAA" 
                        onChange={(e) => {
                          const formattedValue = formatDate(e.target.value);
                          onChange(formattedValue);
                        }} 
                        maxLength={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataPagamento"
                render={({ field: { onChange, ...rest } }) => (
                  <FormItem>
                    <FormLabel>DATA DO PAGAMENTO</FormLabel>
                    <FormControl>
                      <Input 
                        {...rest} 
                        placeholder="DD/MM/AAAA" 
                        onChange={(e) => {
                          const formattedValue = formatDate(e.target.value);
                          onChange(formattedValue);
                        }} 
                        maxLength={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataFollowUp"
                render={({ field: { onChange, ...rest } }) => (
                  <FormItem>
                    <FormLabel>DATA DO FOLLOW</FormLabel>
                    <FormControl>
                      <Input 
                        {...rest} 
                        placeholder="DD/MM/AAAA" 
                        onChange={(e) => {
                          const formattedValue = formatDate(e.target.value);
                          onChange(formattedValue);
                        }} 
                        maxLength={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="curso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Curso</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome do curso" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="email@exemplo.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(XX) XXXXX-XXXX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OBSERVAÇÃO</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Informações adicionais" 
                      className="min-h-[80px] resize-vertical" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <CardFooter className="px-0 pb-0 pt-6 flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => navigate("/")}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Cadastrando..." : "Cadastrar Aluno"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
