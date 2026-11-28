import { Lista } from '../components/Lista'

export function Medicamentos() {
  return (
    <Lista
      resource="medicamento"
      responseKey="medicamentos"
      title="Medicamentos cadastrados"
      emptyMessage="Nenhum medicamento cadastrado."
      rowKey={(row) => row.medicamento_id}
      columns={[
        { title: 'Medicamento', render: (row) => row.nome_medicamento },
      ]}
    />
  )
}
