"use server";

import { createReservation } from "@/lib/site-data";

function getNowInBrazil() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Sao_Paulo",
    }),
  );
}

export async function submitReservationAction(_previousState, formData) {
  const guestName = String(formData.get("guestName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const guests = Number(formData.get("guests") ?? 0);
  const areaPreference = String(formData.get("areaPreference") ?? "").trim();
  const occasion = String(formData.get("occasion") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!guestName || !phone || !date || !time) {
    return {
      status: "error",
      message: "Preencha nome, telefone, data e horario para enviar a reserva.",
    };
  }

  if (guestName.length > 100) {
    return {
      status: "error",
      message: "O nome do cliente precisa ter no maximo 100 caracteres.",
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

  if (occasion.length > 120) {
    return {
      status: "error",
      message: "A ocasiao precisa ter no maximo 120 caracteres.",
    };
  }

  if (notes.length > 500) {
    return {
      status: "error",
      message: "As observacoes precisam ter no maximo 500 caracteres.",
    };
  }

  if (!Number.isFinite(guests) || guests < 1 || guests > 20) {
    return {
      status: "error",
      message: "Informe uma quantidade de pessoas entre 1 e 20.",
    };
  }

  const reservationMoment = new Date(`${date}T${time}:00`);
  const currentMoment = getNowInBrazil();

  if (Number.isNaN(reservationMoment.getTime())) {
    return {
      status: "error",
      message: "Data ou horario invalidos para a reserva.",
    };
  }

  if (reservationMoment.getTime() < currentMoment.getTime()) {
    return {
      status: "error",
      message: "A reserva precisa ser registrada para um horario futuro.",
    };
  }

  const result = await createReservation({
    guestName,
    email,
    phone,
    date,
    time,
    guests,
    areaPreference,
    occasion,
    notes,
  });

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
    };
  }

  return {
    status: "success",
    mode: "supabase",
    message:
      "Reserva enviada com sucesso. A equipe ja pode acompanhar esse atendimento no painel interno.",
  };
}
