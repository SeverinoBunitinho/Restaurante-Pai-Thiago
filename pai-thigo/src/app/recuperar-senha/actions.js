"use server";

import { getSiteUrl } from "@/lib/site-url";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

function normalizeAuthMailError(message = "") {
  if (/email address not authorized/i.test(message)) {
    return "O Supabase ainda nao esta autorizado a enviar esse e-mail de recuperacao. Configure um SMTP proprio no painel do Supabase ou ajuste o metodo de envio.";
  }

  if (/smtp/i.test(message) || /error sending/i.test(message)) {
    return "O Supabase nao conseguiu enviar o e-mail de recuperacao agora. Verifique a configuracao de SMTP do projeto.";
  }

  return message;
}

export async function requestPasswordResetAction(_previousState, formData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Configure as variaveis do Supabase antes de usar a recuperacao de senha.",
    };
  }

  if (!email) {
    return {
      status: "error",
      message: "Informe o e-mail da conta para continuar.",
    };
  }

  if (email.length > 160) {
    return {
      status: "error",
      message: "O e-mail informado esta maior do que o permitido.",
    };
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Nao foi possivel conectar ao Supabase nesta requisicao.",
    };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await getSiteUrl()}/redefinir-senha`,
  });

  if (error) {
    return {
      status: "error",
      message: normalizeAuthMailError(error.message),
    };
  }

  return {
    status: "success",
    message:
      "Se a conta existir, enviamos o link de redefinicao para a caixa de entrada. Confira tambem spam e promocoes.",
  };
}
