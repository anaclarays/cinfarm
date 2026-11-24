import { Lista } from '../components/Lista'

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function Agenda() {
  return (
    <Lista
      resource="agendamento"
      responseKey="agendamentos"
      title="Próximos agendamentos"
      emptyMessage="Nenhum agendamento futuro encontrado."
      rowKey={(row) => row.agendamento_id}
      filter={(row) => Date.parse(row.data_hora_prevista) >= Date.now()}
      columns={[
        {
          title: 'Data e hora',
          render: (row) => (
            <time dateTime={row.data_hora_prevista}>
              {dateTime.format(new Date(row.data_hora_prevista))}
            </time>
          ),
        },
        { title: 'Paciente', render: (row) => row.paciente },
        {
          title: 'Profissional de saúde',
          render: (row) => row.profissional_saude,
        },
        {
          title: 'Status',
          render: (row) => <span className="tag">{row.status}</span>,
        },
      ]}
    />
  )
}
