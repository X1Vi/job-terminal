import { useEffect, useState } from 'react'
import { isStale } from '../api/snapshot'

const INITIAL = { data: null, loading: true, error: '', refreshing: false }

export function useSnapshot(load, refresh) {
  const [state, setState] = useState(INITIAL)

  useEffect(() => {
    let cancelled = false

    load()
      .then(data => {
        if (cancelled) return
        const stale = isStale(data)
        setState({ data, loading: false, error: '', refreshing: stale })
        if (!stale) return
        refresh()
          .then(fresh => {
            if (cancelled) return
            setState({ data: fresh || data, loading: false, error: '', refreshing: false })
          })
          .catch(() => {
            if (!cancelled) setState(s => ({ ...s, refreshing: false }))
          })
      })
      .catch(err => {
        if (!cancelled) setState({ data: null, loading: false, error: err?.message || 'load failed', refreshing: false })
      })

    return () => { cancelled = true }
  }, [load, refresh])

  return state
}
