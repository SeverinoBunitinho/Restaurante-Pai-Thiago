import {
  BellRing,
  BriefcaseBusiness,
  CalendarClock,
  ChefHat,
  ClipboardList,
  Crown,
  LayoutDashboard,
  SlidersHorizontal,
  ShieldCheck,
  UsersRound,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";

const rolePriority = {
  waiter: 1,
  manager: 2,
  owner: 3,
};

const allModules = [
  {
    key: "reservas",
    href: "/operacao/reservas",
    title: "Fila de reservas",
    description:
      "Confirmar, acomodar e finalizar o atendimento de cada reserva do dia.",
    icon: CalendarClock,
    roles: ["waiter", "manager", "owner"],
  },
  {
    key: "mesas",
    href: "/operacao/mesas",
    title: "Acomodacao do salao",
    description:
      "Distribuir reservas em mesas, abrir ou pausar setores e acompanhar a ocupacao do salao.",
    icon: UtensilsCrossed,
    roles: ["waiter", "manager", "owner"],
  },
  {
    key: "comandas",
    href: "/operacao/comandas",
    title: "Hospitalidade e experiencia",
    description:
      "Ler ocasioes, observacoes e rituais de atendimento para conduzir melhor cada visita.",
    icon: ClipboardList,
    roles: ["waiter", "manager", "owner"],
  },
  {
    key: "menu",
    href: "/operacao/menu",
    title: "Cardapio interno",
    description:
      "Ativar ou pausar pratos para alinhar o salao com a producao da cozinha.",
    icon: ChefHat,
    roles: ["manager", "owner"],
  },
  {
    key: "equipe",
    href: "/operacao/equipe",
    title: "Equipe e acessos",
    description:
      "Controlar perfis internos e acompanhar quem esta liberado para operar o sistema.",
    icon: UsersRound,
    roles: ["manager", "owner"],
  },
  {
    key: "configuracoes",
    href: "/operacao/configuracoes",
    title: "Configuracoes da casa",
    description:
      "Editar contatos, horarios, delivery e informacoes institucionais que aparecem no site.",
    icon: SlidersHorizontal,
    roles: ["manager", "owner"],
  },
  {
    key: "executivo",
    href: "/operacao/executivo",
    title: "Visao executiva",
    description:
      "Ler indicadores do negocio, operacao consolidada e frentes de crescimento da casa.",
    icon: Crown,
    roles: ["owner"],
  },
  {
    key: "painel",
    href: "/painel",
    title: "Painel do turno",
    description:
      "Visao tatica do turno com prioridades, leitura do salao e indicadores operacionais.",
    icon: LayoutDashboard,
    roles: ["waiter", "manager", "owner"],
  },
];

const rolePanels = {
  waiter: {
    title: "Fluxo do salao e atendimento",
    description:
      "O garcom recebe o cliente, distribui o salao e acompanha a experiencia mesa a mesa.",
    quickKeys: ["mesas", "reservas", "comandas"],
    focusKeys: ["mesas", "reservas", "comandas", "painel"],
    highlights: [
      {
        icon: BellRing,
        title: "Ritmo de piso",
        text: "Organize chegada, setor e sequencia de atendimento sem perder o compasso do turno.",
      },
      {
        icon: ShieldCheck,
        title: "Padrao de servico",
        text: "Cada acao no sistema ajuda a manter a experiencia consistente e segura no salao.",
      },
    ],
  },
  manager: {
    title: "Supervisao da equipe e da operacao",
    description:
      "O gerente distribui o time, ajusta setores, acompanha reservas sensiveis e alinha cardapio e acessos.",
    quickKeys: ["equipe", "mesas", "configuracoes"],
    focusKeys: ["equipe", "mesas", "reservas", "menu", "configuracoes", "painel"],
    highlights: [
      {
        icon: BriefcaseBusiness,
        title: "Cobertura da casa",
        text: "Equilibre equipe, setores e disponibilidade da operacao antes dos horarios de pico.",
      },
      {
        icon: ShieldCheck,
        title: "Decisao do turno",
        text: "Menu, reservas, hospitalidade e equipe agora ficam em rotas mais separadas e objetivas.",
      },
    ],
  },
  owner: {
    title: "Controle executivo do restaurante",
    description:
      "O dono acompanha a operacao inteira, corrige gargalos e observa os sinais estrategicos da casa.",
    quickKeys: ["executivo", "configuracoes", "painel"],
    focusKeys: ["executivo", "configuracoes", "equipe", "menu", "mesas", "reservas", "painel"],
    highlights: [
      {
        icon: WalletCards,
        title: "Leitura comercial",
        text: "Entenda a saude da casa com apoio do operacional, do cardapio e da equipe.",
      },
      {
        icon: Crown,
        title: "Comando da casa",
        text: "Acesse rotas diferentes para estrategia, operacao, equipe e leitura de experiencia.",
      },
    ],
  },
};

export function canAccessModule(role, moduleKey) {
  const moduleItem = allModules.find((item) => item.key === moduleKey);

  if (!moduleItem) {
    return false;
  }

  return moduleItem.roles.includes(role);
}

export function getModuleByKey(moduleKey) {
  return allModules.find((item) => item.key === moduleKey) ?? null;
}

export function getStaffModules(role) {
  return allModules.filter((moduleItem) => moduleItem.roles.includes(role));
}

export function getStaffPanel(role) {
  const panel = rolePanels[role] ?? rolePanels.waiter;

  return {
    ...panel,
    quickItems: panel.quickKeys
      .map((key) => getModuleByKey(key))
      .filter(Boolean),
    focusItems: panel.focusKeys
      .map((key) => getModuleByKey(key))
      .filter(Boolean),
  };
}

export function sortStaffDirectory(left, right) {
  const leftPriority = rolePriority[left.role] ?? 0;
  const rightPriority = rolePriority[right.role] ?? 0;

  if (leftPriority !== rightPriority) {
    return rightPriority - leftPriority;
  }

  return left.full_name.localeCompare(right.full_name, "pt-BR");
}
