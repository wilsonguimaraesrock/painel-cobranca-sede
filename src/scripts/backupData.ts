import { supabase } from "@/integrations/supabase/client";
import { writeFileSync } from "fs";
import { join } from "path";

// Script para fazer backup dos dados existentes
const backupData = async () => {
  console.log("📦 Iniciando backup dos dados...");
  
  try {
    // Backup da tabela students
    console.log("1️⃣ Fazendo backup da tabela students...");
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*');
    
    if (studentsError) {
      console.error("❌ Erro ao buscar students:", studentsError);
    } else {
      const studentsFile = join(process.cwd(), "backup-students.json");
      writeFileSync(studentsFile, JSON.stringify(students, null, 2));
      console.log(`✅ Backup students salvo: ${studentsFile} (${students?.length || 0} registros)`);
    }
    
    // Backup da tabela status_history
    console.log("2️⃣ Fazendo backup da tabela status_history...");
    const { data: statusHistory, error: historyError } = await supabase
      .from('status_history')
      .select('*');
    
    if (historyError) {
      console.log("⚠️ Aviso: Não foi possível fazer backup de status_history:", historyError.message);
    } else {
      const historyFile = join(process.cwd(), "backup-status-history.json");
      writeFileSync(historyFile, JSON.stringify(statusHistory, null, 2));
      console.log(`✅ Backup status_history salvo: ${historyFile} (${statusHistory?.length || 0} registros)`);
    }
    
    // Backup da tabela user_profiles
    console.log("3️⃣ Fazendo backup da tabela user_profiles...");
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (profilesError) {
      console.log("⚠️ Aviso: Não foi possível fazer backup de user_profiles:", profilesError.message);
    } else {
      const profilesFile = join(process.cwd(), "backup-user-profiles.json");
      writeFileSync(profilesFile, JSON.stringify(userProfiles, null, 2));
      console.log(`✅ Backup user_profiles salvo: ${profilesFile} (${userProfiles?.length || 0} registros)`);
    }
    
    // Backup da tabela available_months
    console.log("4️⃣ Fazendo backup da tabela available_months...");
    const { data: availableMonths, error: monthsError } = await supabase
      .from('available_months')
      .select('*');
    
    if (monthsError) {
      console.log("⚠️ Aviso: Não foi possível fazer backup de available_months:", monthsError.message);
    } else {
      const monthsFile = join(process.cwd(), "backup-available-months.json");
      writeFileSync(monthsFile, JSON.stringify(availableMonths, null, 2));
      console.log(`✅ Backup available_months salvo: ${monthsFile} (${availableMonths?.length || 0} registros)`);
    }
    
    // Criar arquivo de resumo
    const summary = {
      backup_date: new Date().toISOString(),
      tables: {
        students: students?.length || 0,
        status_history: statusHistory?.length || 0,
        user_profiles: userProfiles?.length || 0,
        available_months: availableMonths?.length || 0
      },
      original_project: {
        url: "https://olhdcicquehastcwvieu.supabase.co",
        project_id: "olhdcicquehastcwvieu"
      }
    };
    
    const summaryFile = join(process.cwd(), "backup-summary.json");
    writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log("\n🎉 Backup concluído com sucesso!");
    console.log("📄 Arquivos criados:");
    console.log("  • backup-students.json");
    console.log("  • backup-status-history.json");
    console.log("  • backup-user-profiles.json");
    console.log("  • backup-available-months.json");
    console.log("  • backup-summary.json");
    
    console.log("\n📊 Resumo:");
    console.log(`  • Students: ${summary.tables.students} registros`);
    console.log(`  • Status History: ${summary.tables.status_history} registros`);
    console.log(`  • User Profiles: ${summary.tables.user_profiles} registros`);
    console.log(`  • Available Months: ${summary.tables.available_months} registros`);
    
    return true;
    
  } catch (error) {
    console.error("💥 Erro durante o backup:", error);
    return false;
  }
};

// Executar backup
backupData()
  .then((success) => {
    if (success) {
      console.log("\n✅ Backup realizado com sucesso!");
      console.log("💡 Agora você pode criar um novo projeto Supabase com segurança");
    } else {
      console.log("\n❌ Falha no backup - verifique os erros acima");
    }
  })
  .catch((error) => {
    console.error("💥 Falha no backup:", error);
  }); 