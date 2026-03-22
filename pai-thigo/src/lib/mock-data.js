import {
  CalendarClock,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  PackageSearch,
  UsersRound,
} from "lucide-react";

export const restaurantInfo = {
  name: "Pai Thiago",
  tagline: "Brasa brasileira, servico refinado e atmosfera memoravel.",
  description:
    "O Pai Thiago e uma casa de cozinha brasileira contemporanea com foco em hospitalidade, ingredientes selecionados e uma experiencia elegante do almoco ao jantar.",
  address: "Rua das Palmeiras, 185",
  city: "Bela Vista, Sao Paulo - SP",
  phone: "(11) 3456-7890",
  whatsapp: "(11) 98765-4321",
  email: "reservas@paithiago.com.br",
  phoneHref: "tel:+551134567890",
  whatsappHref:
    "https://wa.me/5511987654321?text=Ola%20Pai%20Thiago%2C%20quero%20reservar%20uma%20mesa.",
  emailHref: "mailto:reservas@paithiago.com.br",
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=Rua+das+Palmeiras+185+Bela+Vista+Sao+Paulo",
  googleBusinessUrl:
    "https://www.google.com/search?q=Pai+Thiago+Bela+Vista+Sao+Paulo",
  instagramUrl: "https://www.instagram.com/paithiago.restaurante",
  facebookUrl: "https://www.facebook.com/paithiago.restaurante",
  instagramHandle: "@paithiago.restaurante",
  facebookHandle: "/paithiago.restaurante",
  schedule: [
    "Ter a Qui | 12h as 15h | 19h as 23h",
    "Sex e Sab | 12h as 16h | 19h as 0h",
    "Dom | 12h as 17h",
  ],
  holidayPolicy:
    "Feriados e datas especiais funcionam sob agenda da casa e disponibilidade de reservas.",
  serviceNotes: [
    "Reservas com confirmacao rapida pelo sistema e suporte por WhatsApp.",
    "Pedidos digitais conectados a operacao sem precisar atualizar a pagina.",
    "Delivery e retirada com acompanhamento em tempo real para cliente e equipe.",
    "Equipe preparada para almocos executivos, jantares especiais e pequenas celebracoes.",
  ],
  delivery: {
    minimumOrder: 45,
    pickupEtaMinutes: 20,
    hotline: "(11) 98765-4321",
    coverageNote:
      "Entregas disponiveis em bairros proximos com taxa calculada no checkout.",
    neighborhoods: [
      {
        slug: "bela-vista",
        name: "Bela Vista",
        fee: 6,
        etaMinutes: 35,
        window: "Entrega estimada em 30 a 40 minutos.",
      },
      {
        slug: "consolacao",
        name: "Consolacao",
        fee: 8,
        etaMinutes: 40,
        window: "Entrega estimada em 35 a 45 minutos.",
      },
      {
        slug: "paraiso",
        name: "Paraiso",
        fee: 10,
        etaMinutes: 48,
        window: "Entrega estimada em 40 a 50 minutos.",
      },
      {
        slug: "liberdade",
        name: "Liberdade",
        fee: 9,
        etaMinutes: 42,
        window: "Entrega estimada em 35 a 45 minutos.",
      },
    ],
  },
  about: {
    story:
      "Nascido da ideia de juntar cozinha brasileira contemporanea, servico atento e atmosfera calorosa, o Pai Thiago foi desenhado para ser uma casa onde cada detalhe importa: fogo bem tratado, salao elegante e relacao duradoura com o cliente.",
    mission:
      "Oferecer uma experiencia de restaurante completa, onde cozinha, hospitalidade e tecnologia trabalham juntas para receber melhor.",
    values: [
      {
        title: "Hospitalidade",
        text: "Receber com clareza, calor humano e memoria de quem volta para a casa.",
      },
      {
        title: "Cozinha autoral",
        text: "Pratos com identidade brasileira, tecnica atual e apresentacao sofisticada.",
      },
      {
        title: "Operacao impecavel",
        text: "Reserva, cardapio e atendimento conectados para reduzir atrito e aumentar confianca.",
      },
    ],
  },
  gallery: [
    {
      key: "salao",
      title: "Salao principal",
      description:
        "Luz quente, mesas bem distribuidas e leitura elegante para almoco e jantar.",
      caption: "Ambiente principal pensado para ritmo continuo com conforto visual.",
      tone: "warm",
      imageUrl:
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80",
    },
    {
      key: "cozinha",
      title: "Cozinha em movimento",
      description:
        "A brasa, os acabamentos e a precisao do passe sustentam o ritmo da casa.",
      caption: "Tecnica, mise en place e saida coordenada durante o servico.",
      tone: "ember",
      imageUrl:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80",
    },
    {
      key: "prato",
      title: "Pratos assinatura",
      description:
        "Composicao, textura e finalizacao trabalhadas para entregar memoria e identidade.",
      caption: "Cardapio autoral, enxuto e alinhado com a operacao.",
      tone: "sage",
      imageUrl:
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=80",
    },
    {
      key: "varanda",
      title: "Espacos reservados",
      description:
        "Lounge, sala reservada e recortes mais intimistas para encontros especiais.",
      caption: "Cenarios certos para celebracoes, negocios e experiencias privadas.",
      tone: "night",
      imageUrl:
        "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1400&q=80",
    },
  ],
};

export const menuCategories = [
  {
    id: "brasa",
    name: "Da Brasa",
    slug: "da-brasa",
    description: "Cortes selecionados, fogo controlado e acabamentos intensos.",
    accent: "gold",
    items: [
      {
        id: "ancho",
        name: "Bife ancho Pai Thiago",
        description:
          "Ancho grelhado na brasa, demi-glace de rapadura e batatas crocantes com alecrim.",
        price: 92,
        imageUrl:
          "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=80",
        prepTime: "18 min",
        spiceLevel: "suave",
        tags: ["carne", "brasa", "chef"],
        allergens: ["lacteos"],
        signature: true,
        available: true,
      },
      {
        id: "costela",
        name: "Costela laqueada",
        description:
          "Costela bovina assada por longas horas, finalizada com glaze de melaco e farofa amanteigada.",
        price: 86,
        imageUrl:
          "https://images.unsplash.com/photo-1529692236671-f1de4f5b2fba?auto=format&fit=crop&w=1200&q=80",
        prepTime: "22 min",
        spiceLevel: "suave",
        tags: ["slow cooked", "brasileiro"],
        allergens: ["gluten", "lacteos"],
        available: true,
      },
      {
        id: "frango",
        name: "Galeto de ervas frescas",
        description:
          "Galeto marinado em limao-cravo, manteiga de ervas e legumes tostados.",
        price: 64,
        imageUrl:
          "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1200&q=80",
        prepTime: "16 min",
        spiceLevel: "suave",
        tags: ["aves", "leve"],
        allergens: ["lacteos"],
        available: true,
      },
    ],
  },
  {
    id: "mar",
    name: "Mar & Frescor",
    slug: "mar-e-frescor",
    description: "Peixes e frutos do mar com tecnica contemporanea e sotaque brasileiro.",
    accent: "sage",
    items: [
      {
        id: "polvo",
        name: "Polvo na manteiga de garrafa",
        description:
          "Polvo grelhado com arroz de coco tostado, vinagrete morno de tomate e coentro.",
        price: 98,
        imageUrl:
          "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=80",
        prepTime: "20 min",
        spiceLevel: "medio",
        tags: ["frutos do mar", "assinatura"],
        allergens: ["crustaceos"],
        signature: true,
        available: true,
      },
      {
        id: "camarao",
        name: "Camaroes ao molho de moqueca leve",
        description:
          "Camaroes salteados com molho cremoso de coco, pimentoes assados e arroz de castanhas.",
        price: 82,
        imageUrl:
          "https://images.unsplash.com/photo-1565299585323-38174c4a6471?auto=format&fit=crop&w=1200&q=80",
        prepTime: "17 min",
        spiceLevel: "medio",
        tags: ["mar", "cremoso"],
        allergens: ["crustaceos", "oleaginosas"],
        available: true,
      },
      {
        id: "peixe",
        name: "Peixe do dia na chapa",
        description:
          "File do dia, pure de banana-da-terra e emulsao citrica de manteiga noisette.",
        price: 78,
        imageUrl:
          "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&w=1200&q=80",
        prepTime: "15 min",
        spiceLevel: "suave",
        tags: ["peixe", "leve"],
        allergens: ["peixes", "lacteos"],
        available: true,
      },
    ],
  },
  {
    id: "acompanhamentos",
    name: "Acompanhamentos",
    slug: "acompanhamentos",
    description: "Pecas pensadas para compartilhar e compor a mesa.",
    accent: "clay",
    items: [
      {
        id: "arroz-cremoso",
        name: "Arroz cremoso de queijo coalho",
        description:
          "Arroz caldoso, queijo coalho tostado, ciboulette e crocante de castanha.",
        price: 34,
        imageUrl:
          "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80",
        prepTime: "10 min",
        spiceLevel: "suave",
        tags: ["cremoso", "compartilhar"],
        allergens: ["lacteos", "oleaginosas"],
        available: true,
      },
      {
        id: "pirao",
        name: "Pirao de peixe tostado",
        description:
          "Textura aveludada, finalizada com azeite verde e toque de limao.",
        price: 28,
        imageUrl:
          "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
        prepTime: "8 min",
        spiceLevel: "suave",
        tags: ["tradicional", "casa"],
        allergens: ["peixes"],
        available: true,
      },
      {
        id: "verduras",
        name: "Verduras na lenha",
        description:
          "Mix de vegetais braseados com molho citrico e sementes tostadas.",
        price: 26,
        imageUrl:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
        prepTime: "9 min",
        spiceLevel: "suave",
        tags: ["vegetais", "leve"],
        allergens: ["sementes"],
        available: true,
      },
    ],
  },
  {
    id: "sobremesas",
    name: "Sobremesas de Casa",
    slug: "sobremesas",
    description: "Finalizacoes elegantes com memoria afetiva.",
    accent: "cream",
    items: [
      {
        id: "pudim",
        name: "Pudim brulee de rapadura",
        description:
          "Pudim liso de baunilha com crosta fina caramelizada e flor de sal.",
        price: 28,
        imageUrl:
          "https://images.unsplash.com/photo-1587241321921-91a834d6d191?auto=format&fit=crop&w=1200&q=80",
        prepTime: "6 min",
        spiceLevel: "sem picancia",
        tags: ["classico", "casa"],
        allergens: ["ovos", "lacteos"],
        signature: true,
        available: true,
      },
      {
        id: "banana",
        name: "Torta morna de banana",
        description:
          "Bananas caramelizadas, massa amanteigada e sorvete artesanal de creme.",
        price: 31,
        imageUrl:
          "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=1200&q=80",
        prepTime: "9 min",
        spiceLevel: "sem picancia",
        tags: ["quente", "sorvete"],
        allergens: ["gluten", "lacteos", "ovos"],
        available: true,
      },
      {
        id: "mousse",
        name: "Mousse de chocolate com cumaru",
        description:
          "Chocolate intenso, cumaru e crocante de nibs com toque de cafe.",
        price: 29,
        imageUrl:
          "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&w=1200&q=80",
        prepTime: "5 min",
        spiceLevel: "sem picancia",
        tags: ["chocolate", "assinatura"],
        allergens: ["lacteos"],
        available: true,
      },
    ],
  },
];

export const experiences = [
  {
    tag: "Executivo",
    title: "Almoco de negocios",
    description:
      "Menu agil, servico atento e ambiente sofisticado para encontros executivos.",
    capacity: "Ideal para 2 a 8 pessoas",
  },
  {
    tag: "Chef table",
    title: "Jantar degustacao",
    description:
      "Sequencia autoral com harmonizacao opcional para noites especiais e celebracoes.",
    capacity: "Ate 10 pessoas",
  },
  {
    tag: "Private room",
    title: "Sala reservada",
    description:
      "Espaco mais intimo para aniversarios, encontros familiares e reunioes estrategicas.",
    capacity: "Ate 16 pessoas",
  },
  {
    tag: "Corporativo",
    title: "Eventos da casa",
    description:
      "Pacotes desenhados para marcas, empresas e experiencias exclusivas com servico dedicado.",
    capacity: "Ate 40 convidados",
  },
];

export const testimonials = [
  {
    name: "Marina Duarte",
    role: "Cliente recorrente",
    quote:
      "O Pai Thiago parece um restaurante ja consolidado: atendimento maduro, pratos lindos e uma reserva que flui sem atrito.",
  },
  {
    name: "Rafael Nunes",
    role: "Diretor comercial",
    quote:
      "Perfeito para almoco de negocios. O ambiente comunica confianca e o servico e muito acima da media.",
  },
  {
    name: "Beatriz Costa",
    role: "Produtora de eventos",
    quote:
      "A proposta visual do site e a organizacao do espaco passam muita seguranca para fechar eventos privados.",
  },
];

export const dashboardStats = [
  {
    label: "Reservas no mes",
    value: "124",
    description: "Captacao constante via formulario e atendimento assistido.",
  },
  {
    label: "Itens no cardapio",
    value: "12",
    description: "Cardapio enxuto, organizado e simples de gerenciar.",
  },
  {
    label: "Mesas em operacao",
    value: "18",
    description: "Salao principal, lounge e sala reservada.",
  },
  {
    label: "Tempo medio de resposta",
    value: "6 min",
    description: "Fluxo de confirmacao pensado para nao perder demanda.",
  },
];

export const upcomingReservations = [
  {
    id: "res-01",
    guestName: "Juliana Araujo",
    date: "2026-03-20",
    time: "19:30",
    guests: 4,
    occasion: "Aniversario",
    status: "confirmada",
    area: "Sala reservada",
  },
  {
    id: "res-02",
    guestName: "Carlos Menezes",
    date: "2026-03-20",
    time: "21:00",
    guests: 2,
    occasion: "Jantar de negocios",
    status: "em contato",
    area: "Salao principal",
  },
  {
    id: "res-03",
    guestName: "Patricia Lima",
    date: "2026-03-21",
    time: "12:45",
    guests: 6,
    occasion: "Almoco executivo",
    status: "confirmada",
    area: "Lounge",
  },
];

export const operationsModules = [
  {
    title: "Cadastro e relacionamento de clientes",
    actor: "Atendimento",
    description:
      "Base para registrar dados do cliente, acompanhar historico de reservas e elevar o padrao do servico.",
    features: ["dados essenciais", "observacoes", "historico de visitas"],
    icon: UsersRound,
  },
  {
    title: "Gestao de produtos e catalogo",
    actor: "Cozinha / gerente",
    description:
      "Organiza categorias, disponibilidade, assinatura da casa e precos com clareza para operacao e site.",
    features: ["categorias", "pratos ativos", "destaques", "precos"],
    icon: PackageSearch,
  },
  {
    title: "Controle de reservas e mesas",
    actor: "Recepcao",
    description:
      "Fluxo para data, horario, numero de pessoas, ocasiao e status de confirmacao.",
    features: ["datas", "horarios", "status", "ocupacao"],
    icon: CalendarClock,
  },
  {
    title: "Contas e fechamento",
    actor: "Caixa",
    description:
      "Modulo conceitual alinhado a modelagem original para apoiar cobranca, consumo e fechamento.",
    features: ["fechamento", "formas de pagamento", "controle do salao"],
    icon: CreditCard,
  },
  {
    title: "Painel gerencial",
    actor: "Gerencia",
    description:
      "Indicadores para leitura rapida da operacao, avaliacao do fluxo e decisoes do dia.",
    features: ["indicadores", "reservas futuras", "produtos", "insights"],
    icon: LayoutDashboard,
  },
  {
    title: "Execucao da cozinha",
    actor: "Producao",
    description:
      "Informacoes de preparo, pratos assinatura e ritmo de saida alinhados ao servico da cozinha.",
    features: ["tempo de preparo", "disponibilidade", "prioridade", "mise en place"],
    icon: ChefHat,
  },
];
