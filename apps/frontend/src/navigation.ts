import { Agenda } from './pages/Agenda'
import { Estabelecimentos, Medicamentos } from './pages/Operacional'
import { Pessoas } from './pages/Pessoas'
import { RealizarAgendamento } from './pages/RealizarAgendamento'
import { VisaoGeral } from './pages/VisaoGeral'

export const pages = {
	'visao-geral': {
		title: 'Visão Geral',
		description: "Acomponhe em números todas as entidades cadastradas",
		Component: VisaoGeral
	},
  agenda: {
    title: 'Agenda',
    description: 'Acompanhe os próximos agendamentos de consultas.',
    Component: Agenda,
  },
  'realizar-agendamento': {
    title: 'Realizar Agendamento',
    description:
      'Cadastre um novo agendamento com suas medições clínicas e tipos de parâmetro.',
    Component: RealizarAgendamento,
	},
	pessoas: {
		title: 'Pessoas',
    description: 'Consulte as pessoas cadastradas e adicione novas no sistema.',
    Component: Pessoas,
	},
  medicamentos: {
    title: 'Medicamentos',
    description: 'Consulte os medicamentos cadastrados no sistema.',
    Component: Medicamentos,
  },
  estabelecimentos: {
    title: 'Estabelecimentos',
    description: 'Consulte os estabelecimentos de saúde cadastrados.',
    Component: Estabelecimentos,
  },
}

export type Page = keyof typeof pages

export function getPage(): Page {
	const slug = window.location.hash.slice(1)
	const page = (pages as Record<string, { Component?: unknown }>)[slug]
  return page?.Component ? (slug as Page) : 'agenda'
}