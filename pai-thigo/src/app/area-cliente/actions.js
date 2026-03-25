"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function buildAreaClienteRedirect(extras = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(extras)) {
    if (value == null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `/area-cliente?${query}` : "/area-cliente";
}

export async function updateCustomerVipPreferenceAction(formData) {
  const session = await requireRole("customer");
  const preferredRoom = String(formData.get("preferredRoom") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!preferredRoom) {
    redirect(
      buildAreaClienteRedirect({
        vipError: "Selecione o ambiente preferido para atualizar seu perfil.",
      }),
    );
  }

  if (preferredRoom.length > 80 || phone.length > 32) {
    redirect(
      buildAreaClienteRedirect({
        vipError: "Os campos de perfil excederam o limite permitido.",
      }),
    );
  }

  const adminClient = getSupabaseAdminClient();

  if (!adminClient) {
    redirect(
      buildAreaClienteRedirect({
        vipError:
          "Nao foi possivel conectar ao banco para salvar suas preferencias agora.",
      }),
    );
  }

  const updateResult = await adminClient
    .from("profiles")
    .update({
      preferred_room: preferredRoom,
      phone: phone || null,
    })
    .eq("user_id", session.user.id);

  if (updateResult.error) {
    redirect(
      buildAreaClienteRedirect({
        vipError: "Nao foi possivel salvar suas preferencias neste momento.",
      }),
    );
  }

  revalidatePath("/area-cliente");
  revalidatePath("/reservas");

  redirect(
    buildAreaClienteRedirect({
      vipNotice: "Perfil VIP atualizado com sucesso.",
    }),
  );
}
