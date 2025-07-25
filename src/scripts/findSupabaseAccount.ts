import { supabase } from "@/integrations/supabase/client";

// Script para descobrir informações sobre a conta do Supabase
const findSupabaseAccount = async () => {
  console.log("🔍 Investigando informações da conta Supabase...");
  console.log("📊 Project ID: olhdcicquehastcwvieu");
  console.log("🌐 URL: https://olhdcicquehastcwvieu.supabase.co\n");
  
  try {
    // 1. Verificar informações dos usuários criados
    console.log("1️⃣ Analisando usuários do sistema...");
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (userProfiles && userProfiles.length > 0) {
      console.log("👥 Usuários encontrados:");
      userProfiles.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
        console.log(`      Criado: ${new Date(user.created_at).toLocaleDateString('pt-BR')}`);
        if (user.last_login) {
          console.log(`      Último login: ${new Date(user.last_login).toLocaleDateString('pt-BR')}`);
        }
      });
      
      // O primeiro usuário geralmente indica quem criou o projeto
      const firstUser = userProfiles[0];
      console.log(`\n💡 DICA: O projeto provavelmente foi criado por: ${firstUser.email}`);
      console.log(`   Procure por esta conta no Supabase dashboard.`);
    }
    
    // 2. Verificar quando o projeto foi usado pela última vez
    console.log("\n2️⃣ Analisando atividade recente...");
    const { data: recentStudents, error: studentsError } = await supabase
      .from('students')
      .select('created_at, updated_at, mes')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (recentStudents && recentStudents.length > 0) {
      console.log("📅 Atividade recente:");
      recentStudents.forEach((student, index) => {
        const updatedDate = student.updated_at ? new Date(student.updated_at).toLocaleString('pt-BR') : 'N/A';
        console.log(`   ${index + 1}. Mês: ${student.mes} - Atualizado: ${updatedDate}`);
      });
    }
    
    // 3. Verificar meses disponíveis (pode dar pistas sobre quem usa o sistema)
    console.log("\n3️⃣ Analisando meses disponíveis...");
    const { data: availableMonths, error: monthsError } = await supabase
      .from('available_months')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (availableMonths && availableMonths.length > 0) {
      console.log("📆 Meses configurados:");
      availableMonths.forEach((month, index) => {
        const createdDate = new Date(month.created_at).toLocaleDateString('pt-BR');
        console.log(`   ${index + 1}. ${month.display_name} (${month.month_value}) - Criado: ${createdDate}`);
      });
    }
    
    // 4. Verificar configurações do projeto
    console.log("\n4️⃣ Informações técnicas do projeto:");
    console.log(`   • Project ID: olhdcicquehastcwvieu`);
    console.log(`   • Region: Provavelmente South America (baseado na latência)`);
    console.log(`   • Database: PostgreSQL`);
    
    // 5. Sugestões para encontrar a conta
    console.log("\n🎯 COMO ENCONTRAR A CONTA:");
    console.log("   1. Acesse: https://supabase.com/dashboard");
    console.log("   2. Faça login com TODAS as suas contas de email");
    console.log("   3. Procure por um projeto com as características:");
    console.log("      • Nome pode ser: kanban, cobranca, rockfeller, etc.");
    console.log("      • Project ID: olhdcicquehastcwvieu");
    console.log("      • Contém tabelas: students, user_profiles, status_history");
    
    if (userProfiles && userProfiles.length > 0) {
      const emailsToTry = [...new Set(userProfiles.map(user => {
        const email = user.email.toLowerCase();
        // Extrair domínio do email para sugerir contas possíveis
        const domain = email.split('@')[1];
        return { email, domain };
      }))];
      
      console.log("\n📧 EMAILS PARA TESTAR NO LOGIN:");
      emailsToTry.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.email}`);
        if (item.domain === 'gmail.com') {
          console.log(`      → Pode estar na conta Google: ${item.email}`);
        }
      });
    }
    
    console.log("\n⚠️ SE AINDA NÃO ENCONTRAR:");
    console.log("   • O projeto pode estar em uma organização/team");
    console.log("   • Pode estar em uma conta que você esqueceu");
    console.log("   • Pode ter sido criado por outra pessoa da equipe");
    console.log("   • Pode estar pausado/suspenso");
    
    console.log("\n💡 ALTERNATIVA:");
    console.log("   Se não conseguir encontrar, podemos criar um novo projeto");
    console.log("   e migrar todos os dados (já temos backup completo!)");
    
    return true;
    
  } catch (error) {
    console.error("💥 Erro ao investigar conta:", error);
    return false;
  }
};

// Executar investigação
findSupabaseAccount()
  .then((success) => {
    if (success) {
      console.log("\n✅ Investigação concluída!");
      console.log("🔍 Use as informações acima para encontrar a conta correta");
    } else {
      console.log("\n❌ Falha na investigação");
    }
  })
  .catch((error) => {
    console.error("💥 Erro:", error);
  }); 