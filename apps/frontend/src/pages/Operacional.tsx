import { Lista } from '../components/Lista'

export function Estabelecimentos() {
  return (
    <Lista
      resource="estabelecimento"
      responseKey="estabelecimentos"
      title="Estabelecimentos cadastrados"
      emptyMessage="Nenhum estabelecimento cadastrado."
      rowKey={(row) => row.estabelecimento_id}
      columns={[
        { title: 'Nome', render: (row) => row.nome },
        {
          title: 'Atendimento',
          render: (row) => (
            <span className="tag">
              {row.tipo_atendimento === 'publico' ? 'Público' : 'Privado'}
            </span>
          ),
        },
        {
          title: 'Endereço',
          render: (row) =>
            [row.logradouro, row.numero, row.bairro].filter(Boolean).join(', '),
        },
        {
          title: 'Cidade / UF',
          render: (row) => `${row.cidade} / ${row.estado}`,
        },
      ]}
    />
  )
}
