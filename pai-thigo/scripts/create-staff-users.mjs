import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env.local");

function loadLocalEnv() {
  if (!existsSync(envPath)) {
    return;
  }

  const envContent = readFileSync(envPath, "utf8");

  for (const rawLine of envContent.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    [
      "Faltam variaveis para criar os funcionarios.",
      "Adicione em .env.local:",
      "NEXT_PUBLIC_SUPABASE_URL=...",
      "SUPABASE_SERVICE_ROLE_KEY=...",
    ].join("\n"),
  );
  process.exit(1);
}

const staffAccounts = [
  {
    email: "garcom@paithiago.com.br",
    full_name: "Caio Atendimento",
    role: "waiter",
    password: "123123",
  },
  {
    email: "gerente@paithiago.com.br",
    full_name: "Marina Gestao",
    role: "manager",
    password: "123123",
  },
  {
    email: "dono@paithiago.com.br",
    full_name: "Thiago Proprietario",
    role: "owner",
    password: "123123",
  },
];

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { error: staffDirectoryError } = await supabase
  .from("staff_directory")
  .upsert(
    staffAccounts.map(({ email, full_name, role }) => ({
      email,
      full_name,
      role,
      active: true,
    })),
    { onConflict: "email" },
  );

if (staffDirectoryError) {
  console.error(
    "Nao foi possivel atualizar a tabela staff_directory. Rode o schema.sql no Supabase antes de usar este script.",
  );
  console.error(staffDirectoryError.message);
  process.exit(1);
}

const {
  data: { users },
  error: listUsersError,
} = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listUsersError) {
  console.error("Nao foi possivel listar os usuarios do Auth.");
  console.error(listUsersError.message);
  process.exit(1);
}

for (const account of staffAccounts) {
  const existingUser = users.find(
    (user) => user.email?.toLowerCase() === account.email.toLowerCase(),
  );
  let resolvedUserId = existingUser?.id ?? null;

  if (existingUser) {
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: account.password,
      email_confirm: true,
      user_metadata: {
        full_name: account.full_name,
      },
    });

    if (error) {
      console.error(`Erro ao atualizar ${account.email}: ${error.message}`);
      continue;
    }

    resolvedUserId = existingUser.id;
    console.log(`Senha atualizada para ${account.email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: {
        full_name: account.full_name,
      },
    });

    if (error) {
      console.error(`Erro ao criar ${account.email}: ${error.message}`);
      continue;
    }

    resolvedUserId = data.user?.id ?? null;
    console.log(`Usuario criado: ${account.email}`);
  }

  if (!resolvedUserId) {
    console.error(`Nao foi possivel resolver user_id para ${account.email}.`);
    continue;
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      user_id: resolvedUserId,
      email: account.email.toLowerCase(),
      full_name: account.full_name,
      phone: null,
      role: account.role,
      loyalty_points: 0,
      preferred_room: "Salao principal",
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    console.error(`Erro ao sincronizar perfil de ${account.email}: ${profileError.message}`);
    continue;
  }

  console.log(`Perfil sincronizado: ${account.email} (${account.role})`);
}

console.log("\nFuncionarios preparados com senha 123123.");
