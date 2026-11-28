import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { CircleAlert, List, LoaderCircle } from 'lucide-react'
import { buscarLista } from '../api/listas'
import type { ListaApi } from '../api/listas'

type Column<Row> = {
  title: string
  render: (row: Row) => ReactNode
}

type ListProps<Resource extends keyof ListaApi> = {
  resource: Resource
  responseKey: ListaApi[Resource]['key']
  title: string
  emptyMessage: string
  columns: Column<ListaApi[Resource]['row']>[]
  rowKey: (row: ListaApi[Resource]['row']) => string | number
  filter?: (row: ListaApi[Resource]['row']) => boolean
  query?: string
}

type LoadState<Row> =
  { status: 'loading' | 'error' } | { status: 'ready'; rows: Row[] }

export function Lista<Resource extends keyof ListaApi>({
  resource,
  responseKey,
  title,
  emptyMessage,
  columns,
  rowKey,
  filter,
  query,
}: ListProps<Resource>) {
  const [state, setState] = useState<LoadState<ListaApi[Resource]['row']>>({
    status: 'loading',
  })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    buscarLista(resource, responseKey, controller.signal, query).then(
      (rows) => {
        if (!controller.signal.aborted) setState({ status: 'ready', rows })
      },
      () => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      },
    )
    return () => controller.abort()
  }, [resource, responseKey, attempt, query])

  const rows =
    state.status === 'ready'
      ? filter
        ? state.rows.filter(filter)
        : state.rows
      : []

  return (
    <section className="list-card" aria-labelledby="list-title">
      <div className="list-header">
        <h2 id="list-title">{title}</h2>
        {state.status === 'ready' && (
          <span className="record-count">
            {rows.length} {rows.length === 1 ? 'registro' : 'registros'}
          </span>
        )}
      </div>
      {state.status === 'loading' && (
        <div className="list-state" role="status">
          <LoaderCircle className="spinner" size={22} aria-hidden="true" />
          <p>Carregando registros…</p>
        </div>
      )}
      {state.status === 'error' && (
        <div className="list-state">
          <CircleAlert size={22} aria-hidden="true" />
          <p role="alert">Não foi possível carregar os registros.</p>
          <button
            type="button"
            className="retry"
            onClick={() => {
              setState({ status: 'loading' })
              setAttempt((value) => value + 1)
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {state.status === 'ready' &&
        (rows.length > 0 ? (
          <div
            className="table-scroll"
            role="region"
            aria-labelledby="list-title"
            tabIndex={0}
          >
            <table aria-labelledby="list-title">
              <thead>
                <tr>
                  {columns.map(({ title }) => (
                    <th key={title} scope="col">
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={rowKey(row)}>
                    {columns.map(({ title, render }) => (
                      <td key={title}>{render(row)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="list-state" role="status">
            <List size={22} aria-hidden="true" />
            <p>{emptyMessage}</p>
          </div>
        ))}
    </section>
  )
}
