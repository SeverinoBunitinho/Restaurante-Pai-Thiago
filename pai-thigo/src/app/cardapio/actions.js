"use server";

import { revalidatePath } from "next/cache";

import { createOrder } from "@/lib/site-data";

function revalidateOrderPaths() {
  revalidatePath("/cardapio");
  revalidatePath("/area-cliente");
  revalidatePath("/area-funcionario");
  revalidatePath("/painel");
  revalidatePath("/operacao");
  revalidatePath("/operacao/comandas");
}

export async function submitOrderAction(_previousState, formData) {
  const menuItemId = String(formData.get("menuItemId") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();

  if (!menuItemId) {
    return {
      status: "error",
      message: "Escolha um prato valido antes de enviar o pedido.",
    };
  }

  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
    return {
      status: "error",
      message: "Informe uma quantidade entre 1 e 20 itens.",
    };
  }

  if (notes.length > 300) {
    return {
      status: "error",
      message: "As observacoes do pedido precisam ter no maximo 300 caracteres.",
    };
  }

  const result = await createOrder({
    menuItemId,
    quantity,
    notes,
  });

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidateOrderPaths();

  return {
    status: "success",
    message: result.message,
  };
}
