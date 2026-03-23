import {
  BarChart3,
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
    title: "Comandas e fechamento",
    description:
      "Abrir contas por mesa, lancar produtos, localizar contas abertas e fechar com impressao.",
    icon: ClipboardList,
    roles: ["waiter", "manager", "owner"],
  },
  {
    key: "cozinha",
    href: "/operacao/cozinha",
    title: "Fila da cozinha",
    description:
      "Organizar o preparo em tempo real, da entrada do pedido ate a expedicao.",
    icon: ChefHat,
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
    key: "escala",
    href: "/operacao/escala",
    title: "Escala da equipe",
    description:
      "Planejar turnos por data e acompanhar cobertura operacional da casa.",
    icon: CalendarClock,
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
    key: "campanhas",
    href: "/operacao/campanhas",
    title: "Campanhas e cupons",
    description:
      "Criar campanhas sazonais e cupons para ativar demanda sem baguncar a operacao.",
    icon: BellRing,
    roles: ["manager", "owner"],
  },
  {
    key: "relatorios",
    href: "/operacao/relatorios",
    title: "Relatorios e comissoes",
    description:
      "Calcular comissoes dos garcons e acompanhar ocupacao das mesas por periodo.",
    icon: BarChart3,
    roles: ["manager", "owner"],
  },
  {
    key: "previsao",
    href: "/operacao/previsao",
    title: "Previsao de demanda",
    description:
      "Projetar reservas, pedidos e picos de atendimento para o proximo turno.",
    icon: BarChart3,
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
    key: "auditoria",
    href: "/operacao/auditoria",
    title: "Auditoria operacional",
    description:
      "Rastrear alteracoes criticas para seguranca, governanca e conferencias internas.",
    icon: ShieldCheck,
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
      "O garcom recebe o cliente, abre a conta da mesa, lanca pedidos e acompanha o fechamento.",
    quickKeys: ["comandas", "cozinha", "mesas"],
    focusKeys: ["comandas", "cozinha", "mesas", "reservas", "painel"],
    highlights: [
      {
        icon: BellRing,
        title: "Ritmo de piso",
        text: "Organize chegada, setor, conta da mesa e sequencia de atendimento sem perder o compasso do turno.",
      },
      {
        icon: ShieldCheck,
        title: "Padrao de servico",
        text: "Cada conta aberta e fechada corretamente ajuda a manter a experiencia segura e auditavel no salao.",
      },
    ],
  },
  manager: {
    title: "Supervisao da equipe e da operacao",
    description:
      "O gerente distribui o time, cadastra garcons, acompanha comandas, comissoes, reservas e a leitura do salao.",
    quickKeys: ["equipe", "cozinha", "comandas"],
    focusKeys: [
      "equipe",
      "escala",
      "cozinha",
      "comandas",
      "relatorios",
      "previsao",
      "campanhas",
      "mesas",
      "reservas",
      "menu",
      "configuracoes",
      "painel",
    ],
    highlights: [
      {
        icon: BriefcaseBusiness,
        title: "Cobertura da casa",
        text: "Equilibre equipe, setores, comandas e disponibilidade da operacao antes dos horarios de pico.",
      },
      {
        icon: ShieldCheck,
        title: "Decisao do turno",
        text: "Equipe, comissao, ocupacao e fechamento agora ficam em rotas mais claras e objetivas.",
      },
    ],
  },
  owner: {
    title: "Controle executivo do restaurante",
    description:
      "O dono acompanha a operacao inteira, cadastra gerentes, corrige gargalos e observa os sinais estrategicos da casa.",
    quickKeys: ["executivo", "auditoria", "relatorios"],
    focusKeys: [
      "executivo",
      "auditoria",
      "relatorios",
      "previsao",
      "campanhas",
      "equipe",
      "escala",
      "cozinha",
      "comandas",
      "configuracoes",
      "menu",
      "mesas",
      "reservas",
      "painel",
    ],
    highlights: [
      {
        icon: WalletCards,
        title: "Leitura comercial",
        text: "Entenda a saude da casa com apoio das comandas, das comissoes, do cardapio e da equipe.",
      },
      {
        icon: Crown,
        title: "Comando da casa",
        text: "Acesse rotas diferentes para estrategia, operacao, equipe, comissao e leitura de experiencia.",
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
