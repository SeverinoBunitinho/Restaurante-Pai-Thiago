"use server";

import { revalidatePath } from "next/cache";

import { createCartOrder } from "@/lib/site-data";

function revalidateCheckoutPaths() {
  revalidatePath("/cardapio");
  revalidatePath("/carrinho");
  revalidatePath("/area-cliente");
  revalidatePath("/painel");
  revalidatePath("/operacao");
  revalidatePath("/operacao/comandas");
}

export async function submitCartCheckoutAction(_previousState, formData) {
  const paymentMethod = String(formData.get("paymentMethod") ?? "").trim();
  const fulfillmentType = String(formData.get("fulfillmentType") ?? "").trim();
  const deliveryNeighborhood = String(formData.get("deliveryNeighborhood") ?? "").trim();
  const deliveryAddress = String(formData.get("deliveryAddress") ?? "").trim();
  const deliveryReference = String(formData.get("deliveryReference") ?? "").trim();
  const cartPayload = String(formData.get("cartPayload") ?? "").trim();

  let items = [];

  try {
    items = JSON.parse(cartPayload);
  } catch {
    return {
      status: "error",
      message: "Nao foi possivel ler os itens do carrinho. Atualize a pagina e tente novamente.",
      checkoutReference: "",
      fulfillmentType: "",
      deliveryFee: 0,
      deliveryEtaMinutes: 0,
      grandTotal: 0,
    };
  }

  const result = await createCartOrder({
    paymentMethod,
    fulfillmentType,
    deliveryNeighborhood,
    deliveryAddress,
    deliveryReference,
    items,
  });

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      checkoutReference: "",
      fulfillmentType: "",
      deliveryFee: 0,
      deliveryEtaMinutes: 0,
      grandTotal: 0,
    };
  }

  revalidateCheckoutPaths();

  return {
    status: "success",
    message: result.message,
    checkoutReference: result.checkoutReference ?? "",
    fulfillmentType: result.fulfillmentType ?? "",
    deliveryFee: result.deliveryFee ?? 0,
    deliveryEtaMinutes: result.deliveryEtaMinutes ?? 0,
    grandTotal: result.grandTotal ?? 0,
  };
}
