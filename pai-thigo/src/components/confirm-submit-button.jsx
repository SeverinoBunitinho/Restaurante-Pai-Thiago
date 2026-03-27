"use client";

export function ConfirmSubmitButton({
  children,
  message = "Tem certeza?",
  className,
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}

