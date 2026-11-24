import type { Pessoa } from '../api/listas'
import { Lista } from '../components/Lista'

const personColumns = [
  { title: 'Nome', render: (person: Pessoa) => person.name },
  { title: 'Telefone', render: (person: Pessoa) => person.telephone },
]

export function Pacientes() {
  return (
    <Lista
      resource="pessoa"
      responseKey="All people"
      title="Pacientes cadastrados"
      emptyMessage="Nenhum paciente cadastrado."
      rowKey={(person) => person.cpf}
      filter={(person) => person.perfil === 'paciente'}
      columns={personColumns}
    />
  )
}

export function Profissionais() {
  return (
    <Lista
      resource="pessoa"
      responseKey="All people"
      title="Profissionais e estagiários"
      emptyMessage="Nenhum profissional de saúde ou estagiário cadastrado."
      rowKey={(person) => person.cpf}
      filter={(person) =>
        person.perfil === 'profissional_saude' || person.perfil === 'estagiario'
      }
      columns={[
        ...personColumns,
        {
          title: 'Perfil',
          render: (person) => (
            <span className="tag">
              {person.perfil === 'estagiario'
                ? 'Estagiário'
                : 'Profissional de saúde'}
            </span>
          ),
        },
      ]}
    />
  )
}
