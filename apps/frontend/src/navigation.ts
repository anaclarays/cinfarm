import { Agenda } from './pages/Agenda'
import { Estabelecimentos, Medicamentos } from './pages/Operacional'
import { Pacientes, Profissionais } from './pages/Pessoas'
import { RealizarAgendamento } from './pages/RealizarAgendamento'

export const pages = {
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
  pacientes: {
    title: 'Pacientes',
    description: 'Consulte os pacientes cadastrados no sistema.',
    Component: Pacientes,
  },
  profissionais: {
    title: 'Profissionais de Saúde',
    description:
      'Consulte os profissionais de saúde e estagiários cadastrados.',
    Component: Profissionais,
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
  return Object.hasOwn(pages, slug) ? (slug as Page) : 'agenda'
}
