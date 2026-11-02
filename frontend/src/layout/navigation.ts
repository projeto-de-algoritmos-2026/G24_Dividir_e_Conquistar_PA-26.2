import { Crosshair, FlaskConical, PlaneLanding, RadioTower, ShieldAlert, type LucideIcon } from "lucide-react";

export type ViewId = "traffic" | "conflicts" | "closest" | "landing" | "laboratory";

export type ViewDescription = {
  id: ViewId;
  section: "operations";
  hash: string;
  label: string;
  icon: LucideIcon;
  crumb: string;
  overline: string;
  title: string;
  summary: string;
};

export const VIEWS: ViewDescription[] = [
  {
    id: "traffic",
    section: "operations",
    hash: "trafego",
    label: "Tráfego aéreo",
    icon: RadioTower,
    crumb: "ESPAÇO AÉREO",
    overline: "MONITORAMENTO / AMÉRICA DO SUL",
    title: "Tráfego em movimento",
    summary: "Rotas entre aeroportos, aeronaves em deslocamento e detecção espacial contínua.",
  },
  {
    id: "conflicts",
    section: "operations",
    hash: "conflitos",
    label: "Conflitos previstos",
    icon: ShieldAlert,
    crumb: "PREVISÃO DE CONFLITOS",
    overline: "MONITORAMENTO / AMÉRICA DO SUL",
    title: "Previsão de aproximações",
    summary: "Pares encontrados pela busca espacial e avaliados pela projeção de 15 minutos.",
  },
  {
    id: "closest",
    section: "operations",
    hash: "par-mais-proximo",
    label: "Par mais próximo",
    icon: Crosshair,
    crumb: "PAR MAIS PRÓXIMO",
    overline: "OPERAÇÕES / PAR DE PONTOS MAIS PRÓXIMOS",
    title: "Como o radar encontra o par mais próximo",
    summary:
      "Um instante do tráfego congelado e reproduzido passo a passo: dividir ao meio, resolver cada metade e combinar pela faixa central.",
  },
  {
    id: "landing",
    section: "operations",
    hash: "fila-de-pouso",
    label: "Sequência de chegadas",
    icon: PlaneLanding,
    crumb: "CONTAGEM DE INVERSÕES",
    overline: "OPERAÇÕES / CONTAGEM DE INVERSÕES",
    title: "Ordem de decolagem x ordem de pouso",
    summary: "Para cada aeroporto, quantos pares de voos invertem a ordem: quem decolou depois e vai pousar antes.",
  },
  {
    id: "laboratory",
    section: "operations",
    hash: "laboratorio",
    label: "Laboratório",
    icon: FlaskConical,
    crumb: "LABORATÓRIO",
    overline: "OPERAÇÕES / COMPLEXIDADE",
    title: "Laboratório de desempenho",
    summary: "Tráfego sintético em escala crescente, comparando cada algoritmo com a alternativa ingênua.",
  },
];

export const findView = (id: ViewId) => VIEWS.find((view) => view.id === id) ?? VIEWS[0];

export const viewFromHash = (hash: string): ViewId =>
  VIEWS.find((view) => view.hash === hash.replace(/^#\/?/, ""))?.id ?? "traffic";

