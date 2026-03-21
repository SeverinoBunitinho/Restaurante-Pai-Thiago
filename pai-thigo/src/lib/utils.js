import { clsx } from "clsx";

export const paymentMethodOptions = [
    { value: "pix", label: "Pix" },
    { value: "credit_card", label: "Cartao de credito" },
    { value: "debit_card", label: "Cartao de debito" },
    { value: "cash", label: "Dinheiro" },
];

export const fulfillmentTypeOptions = [
    { value: "delivery", label: "Delivery" },
    { value: "pickup", label: "Retirada" },
];

export function cn(...inputs) {
    return clsx(inputs);
}

export function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

export function formatReservationMoment(date, time) {
    const reservationDate = new Date(`${date}T${time}`);
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(reservationDate);
}

export function getPaymentMethodLabel(value) {
    return paymentMethodOptions.find((item) => item.value === value)?.label ?? "Pagamento";
}

export function getFulfillmentTypeLabel(value) {
    return (
        fulfillmentTypeOptions.find((item) => item.value === value)?.label ??
        "Atendimento"
    );
}
