"use server";

import { createReservation } from "@/lib/site-data";

function getNowInBrazil() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Sao_Paulo",
    }),
  );
}

function formatDateForMessage(value) {
  const parts = String(value ?? "").split("-");

  if (parts.length !== 3) {
    return String(value ?? "");
  }

  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export async function submitReservationAction(_previousState, formData) {
  const guestName = String(formData.get("guestName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const guests = Number(formData.get("guests") ?? 0);
  const rawAreaPreference = String(formData.get("areaPreference") ?? "").trim();
  const areaPreference = rawAreaPreference === "__ANY__" ? "" : rawAreaPreference;
  const selectedTableId = String(formData.get("selectedTableId") ?? "").trim();
  const occasion = String(formData.get("occasion") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!guestName || !phone || !date || !time) {
    return {
      status: "error",
      message: "Preencha nome, telefone, data e horario para enviar a reserva.",
      receipt: null,
    };
  }

  if (guestName.length > 100) {
    return {
      status: "error",
      message: "O nome do cliente precisa ter no maximo 100 caracteres.",
      receipt: null,
    };
  }

  if (phone.length > 40) {
    return {
      status: "error",
      message: "O telefone informado esta maior do que o permitido.",
      receipt: null,
    };
  }

  if (email.length > 160) {
    return {
      status: "error",
      message: "O e-mail informado esta maior do que o permitido.",
      receipt: null,
    };
  }

  if (occasion.length > 120) {
    return {
      status: "error",
      message: "A ocasiao precisa ter no maximo 120 caracteres.",
      receipt: null,
    };
  }

  if (notes.length > 500) {
    return {
      status: "error",
      message: "As observacoes precisam ter no maximo 500 caracteres.",
      receipt: null,
    };
  }

  if (!Number.isFinite(guests) || guests < 1 || guests > 20) {
    return {
      status: "error",
      message: "Informe uma quantidade de pessoas entre 1 e 20.",
      receipt: null,
    };
  }

  const reservationMoment = new Date(`${date}T${time}:00`);
  const currentMoment = getNowInBrazil();

  if (Number.isNaN(reservationMoment.getTime())) {
    return {
      status: "error",
      message: "Data ou horario invalidos para a reserva.",
      receipt: null,
    };
  }

  if (reservationMoment.getTime() < currentMoment.getTime()) {
    return {
      status: "error",
      message: "A reserva precisa ser registrada para um horario futuro.",
      receipt: null,
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
    selectedTableId,
    occasion,
    notes,
  });

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      receipt: null,
    };
  }

  const messageParts = [
    `Reserva enviada para ${formatDateForMessage(date)} as ${time}.`,
    result.selectedByUser ? "Mesa escolhida pelo cliente e validada no sistema." : "",
    result.assignedTable?.name
      ? `Mesa separada: ${result.assignedTable.name}.`
      : "",
    result.assignedTable?.area ? `Area: ${result.assignedTable.area}.` : "",
    result.areaAdjusted
      ? "Nao havia vaga na area preferida nesse horario, entao ajustamos para a melhor opcao disponivel."
      : "",
    result.reservation?.confirmationCode
      ? `Comprovante gerado: ${result.reservation.confirmationCode}.`
      : "",
  ].filter(Boolean);

  const receipt = result.reservation
    ? {
        confirmationCode: result.reservation.confirmationCode,
        guestName: result.reservation.guestName,
        reservationDate: formatDateForMessage(result.reservation.reservationDate),
        reservationTime: result.reservation.reservationTime,
        guests: result.reservation.guests,
        tableName: result.reservation.tableName,
        areaName: result.reservation.areaName,
        whatsappUrl: result.reservation.whatsappUrl,
      }
    : null;

  return {
    status: "success",
    mode: "supabase",
    message: messageParts.join(" "),
    receipt,
  };
}
