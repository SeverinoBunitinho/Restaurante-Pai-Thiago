"use server";

import { redirect } from "next/navigation";

import { getSiteUrl } from "@/lib/site-url";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

function normalizeAuthMailError(message = "") {
  if (/email address not authorized/i.test(message)) {
    return "O Supabase ainda nao esta autorizado a enviar esse e-mail de confirmacao. Configure um SMTP proprio no painel do Supabase ou desative a confirmacao de e-mail temporariamente.";
  }

  if (/smtp/i.test(message) || /error sending confirmation email/i.test(message)) {
    return "O Supabase nao conseguiu enviar o e-mail de confirmacao agora. Verifique a configuracao de SMTP no painel do projeto.";
  }

  return message;
}

export async function submitSignupAction(_previousState, formData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Configure as variaveis do Supabase antes de usar o cadastro real do sistema.",
    };
  }

  if (!fullName || !email || !password || !confirmPassword) {
    return {
      status: "error",
      message: "Preencha nome, e-mail, senha e confirmacao de senha.",
    };
  }

  if (fullName.length > 100) {
    return {
      status: "error",
      message: "O nome completo precisa ter no maximo 100 caracteres.",
    };
  }

  if (phone.length > 40) {
    return {
      status: "error",
      message: "O telefone informado esta maior do que o permitido.",
    };
  }

  if (email.length > 160) {
    return {
      status: "error",
      message: "O e-mail informado esta maior do que o permitido.",
    };
  }

  if (password.length < 6) {
    return {
      status: "error",
      message: "A senha precisa ter pelo menos 6 caracteres.",
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "A confirmacao de senha nao confere.",
    };
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Nao foi possivel conectar ao Supabase nesta requisicao.",
    };
  }

  const { data: staffFlag, error: staffError } = await supabase.rpc(
    "is_staff_email",
    {
      target_email: email,
    },
  );

  if (staffError) {
    return {
      status: "error",
      message:
        "Nao foi possivel validar o e-mail agora. Verifique o schema do Supabase.",
    };
  }

  if (staffFlag) {
    return {
      status: "error",
      message:
        "E-mails da equipe nao podem ser cadastrados aqui. Funcionarios usam contas internas pre-criadas.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await getSiteUrl()}/login`,
      data: {
        full_name: fullName,
        phone,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      message: normalizeAuthMailError(error.message),
    };
  }

  if (!data.session) {
    return {
      status: "success",
      message:
        "Cadastro concluido. Enviamos um e-mail de confirmacao. Abra sua caixa de entrada e confirme a conta antes de entrar.",
      pendingEmail: email,
      canResend: true,
    };
  }

  redirect("/area-cliente");
}

export async function resendSignupConfirmationAction(_previousState, formData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "O Supabase nao esta configurado para reenviar a confirmacao agora.",
    };
  }

  if (!email) {
    return {
      status: "error",
      message: "Informe um e-mail valido para reenviar a confirmacao.",
    };
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Nao foi possivel conectar ao Supabase nesta requisicao.",
    };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${await getSiteUrl()}/login`,
    },
  });

  if (error) {
    return {
      status: "error",
      message: normalizeAuthMailError(error.message),
    };
  }

  return {
    status: "success",
    message: "Reenviamos o e-mail de confirmacao. Confira a caixa de entrada e o spam.",
  };
}
