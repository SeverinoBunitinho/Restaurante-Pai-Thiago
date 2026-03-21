"use server";

import { redirect } from "next/navigation";

import { getSiteUrl } from "@/lib/site-url";
import { getRouteForRole, isStaffRole } from "@/lib/auth";
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

export async function submitLoginAction(_previousState, formData) {
  const role = String(formData.get("role") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Configure as variaveis do Supabase antes de usar o login real do sistema.",
    };
  }

  if (role !== "customer" && role !== "staff") {
    return {
      status: "error",
      message: "Escolha se o acesso e de cliente ou funcionario.",
    };
  }

  if (!email || !password) {
    return {
      status: "error",
      message: "Preencha e-mail e senha para entrar.",
    };
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Nao foi possivel conectar ao Supabase nesta requisicao.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (
      error.code === "email_not_confirmed" ||
      /email not confirmed/i.test(error.message)
    ) {
      return {
        status: "error",
        message:
          "Sua conta foi criada, mas o e-mail ainda nao foi confirmado. Abra a caixa de entrada ou reenvie a confirmacao abaixo.",
        pendingEmail: email,
        canResend: true,
      };
    }

    return {
      status: "error",
      message: normalizeAuthMailError(error.message),
    };
  }

  if (!data.user) {
    return {
      status: "error",
      message: "Nao foi possivel validar o perfil apos o login.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const resolvedRole = profile?.role ?? "customer";

  if (role === "staff" && !isStaffRole(resolvedRole)) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message:
        "Este acesso e exclusivo para equipe. Use a area de cliente ou uma conta interna criada pela administracao.",
    };
  }

  if (role === "customer" && resolvedRole !== "customer") {
    await supabase.auth.signOut();
    return {
      status: "error",
      message:
        "Esta conta pertence a equipe interna. Entre pela aba de funcionario.",
    };
  }

  redirect(getRouteForRole(resolvedRole));
}

export async function logoutAction() {
  const supabase = await getSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}

export async function resendLoginConfirmationAction(_previousState, formData) {
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
