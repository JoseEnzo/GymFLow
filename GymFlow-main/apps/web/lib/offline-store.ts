/**
 * Offline store pra execução de treino.
 *
 * IndexedDB com dois object stores:
 *  - sheets: snapshot da ficha carregada online, hidratado quando offline.
 *  - pendingWorkouts: fila de treinos finalizados que não chegaram a sincronizar.
 *
 * Idempotência: `clientId` (UUID) é a chave do pendingWorkouts e bate com
 * a coluna `client_id` da RPC `complete_workout` (migration 028). Retry de
 * sync não duplica workout_log no servidor.
 *
 * Multi-tenant: sheets têm chave composta `[userId, sheetId, day]`. Outro
 * usuário no mesmo device NÃO acessa o snapshot — porque busca pelo próprio
 * userId. Não é defesa criptográfica (qualquer um com acesso ao DevTools
 * lê tudo), mas garante que a feature não confunde dados no caso comum.
 */

const DB_NAME = 'meutrein-offline'
const DB_VERSION = 1
const SHEETS_STORE = 'sheets'
const QUEUE_STORE = 'pendingWorkouts'

export interface CachedExercise {
  sheetExerciseId: string
  exerciseId: string
  name: string
  sets: number
  reps: string
  restSeconds: number
  weightSuggestion: number | null
  notes: string | null
}

export interface SheetSnapshot {
  userId: string
  sheetId: string
  day: number // 0 quando não-weekly; sempre incluído pra simplificar a key
  sheetName: string
  scheduleType: 'daily' | 'weekly' | 'monthly'
  availableDays: number[]
  exercises: CachedExercise[]
  prMaxWeights: Record<string, number>
  cachedAt: number
}

export interface PendingWorkout {
  clientId: string
  userId: string
  sheetId: string
  academyId: string
  durationSeconds: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setLogs: any[]
  queuedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB indisponível'))
  }
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(SHEETS_STORE)) {
        db.createObjectStore(SHEETS_STORE, { keyPath: ['userId', 'sheetId', 'day'] })
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'clientId' })
      }
    }
  })
  return dbPromise
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode)
        const objectStore = transaction.objectStore(store)
        const result = run(objectStore)
        if (result instanceof Promise) {
          result.then(resolve, reject)
        } else {
          result.onsuccess = () => resolve(result.result)
          result.onerror = () => reject(result.error)
        }
        transaction.onerror = () => reject(transaction.error)
      }),
  )
}

export async function cacheSheet(snapshot: SheetSnapshot): Promise<void> {
  try {
    await tx<IDBValidKey>(SHEETS_STORE, 'readwrite', (s) => s.put(snapshot))
  } catch {
    /* sem IndexedDB ou falha — silencioso, é um nice-to-have */
  }
}

export async function getCachedSheet(
  userId: string,
  sheetId: string,
  day: number,
): Promise<SheetSnapshot | null> {
  try {
    const result = await tx<SheetSnapshot | undefined>(SHEETS_STORE, 'readonly', (s) =>
      s.get([userId, sheetId, day]),
    )
    return result ?? null
  } catch {
    return null
  }
}

export async function queueWorkout(payload: PendingWorkout): Promise<void> {
  await tx<IDBValidKey>(QUEUE_STORE, 'readwrite', (s) => s.put(payload))
}

export async function getPendingWorkouts(): Promise<PendingWorkout[]> {
  try {
    return await tx<PendingWorkout[]>(QUEUE_STORE, 'readonly', (s) => s.getAll())
  } catch {
    return []
  }
}

export async function removePendingWorkout(clientId: string): Promise<void> {
  try {
    await tx<undefined>(QUEUE_STORE, 'readwrite', (s) => s.delete(clientId))
  } catch {
    /* ignore */
  }
}

export async function countPendingWorkouts(): Promise<number> {
  try {
    return await tx<number>(QUEUE_STORE, 'readonly', (s) => s.count())
  } catch {
    return 0
  }
}
