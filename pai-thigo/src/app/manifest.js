export default function manifest() {
  return {
    name: "Pai Thiago",
    short_name: "Pai Thiago",
    description:
      "Restaurante contemporaneo com reservas, delivery, operacao interna e atendimento digital integrado.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#efe3d1",
    theme_color: "#14231d",
    lang: "pt-BR",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
