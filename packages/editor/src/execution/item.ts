import { uuidSchema } from '@briefer/types'
import * as Y from 'yjs'
import * as z from 'zod'

export const ExecutionQueueItemStatus = z.union([
  z.object({
    _tag: z.literal('enqueued'),
  }),
  z.object({
    _tag: z.literal('aborting'),
  }),
  z.object({
    _tag: z.literal('running'),
  }),
  z.object({
    _tag: z.literal('completed'),
  }),
  z.object({
    _tag: z.literal('unknown'),
  }),
])
export type ExecutionQueueItemStatus = z.infer<typeof ExecutionQueueItemStatus>

export type ExecutionStatus = ExecutionQueueItemStatus['_tag'] | 'idle'

export function isExecutionStatusLoading(
  status: ExecutionStatus
): status is 'running' | 'aborting' | 'enqueued' {
  switch (status) {
    case 'enqueued':
    case 'running':
    case 'aborting':
      return true
    case 'idle':
    case 'completed':
    case 'unknown':
      return false
  }
}

export const ExecutionQueueItemPythonMetadata = z.object({
  _tag: z.literal('python'),
  isSuggestion: z.boolean(),
})
export type ExecutionQueueItemPythonMetadata = z.infer<
  typeof ExecutionQueueItemPythonMetadata
>

export const ExecutionQueueItemSQLMetadata = z.object({
  _tag: z.literal('sql'),
  isSuggestion: z.boolean(),
  selectedCode: z.string().nullable(),
})
export type ExecutionQueueItemSQLMetadata = z.infer<
  typeof ExecutionQueueItemSQLMetadata
>

export const ExecutionQueueItemSQLRenameDataframeMetadata = z.object({
  _tag: z.literal('sql-rename-dataframe'),
})
export type ExecutionQueueItemSQLRenameDataframeMetadata = z.infer<
  typeof ExecutionQueueItemSQLRenameDataframeMetadata
>

export const ExecutionQueueItemVisualizationMetadata = z.object({
  _tag: z.literal('visualization'),
})
export type ExecutionQueueItemVisualizationMetadata = z.infer<
  typeof ExecutionQueueItemVisualizationMetadata
>

export const ExecutionQueueItemTextInputSaveValueMetadata = z.object({
  _tag: z.literal('text-input-save-value'),
})
export type ExecutionQueueItemTextInputSaveValueMetadata = z.infer<
  typeof ExecutionQueueItemTextInputSaveValueMetadata
>

export const ExecutionQueueItemTextInputRenameVariableMetadata = z.object({
  _tag: z.literal('text-input-rename-variable'),
})
export type ExecutionQueueItemTextInputRenameVariableMetadata = z.infer<
  typeof ExecutionQueueItemTextInputRenameVariableMetadata
>

export const ExecutionQueueItemDropdownInputSaveValueMetadata = z.object({
  _tag: z.literal('dropdown-input-save-value'),
})
export type ExecutionQueueItemDropdownInputSaveValueMetadata = z.infer<
  typeof ExecutionQueueItemDropdownInputSaveValueMetadata
>

export const ExecutionQueueItemDropdownInputRenameVariableMetadata = z.object({
  _tag: z.literal('dropdown-input-rename-variable'),
})
export type ExecutionQueueItemDropdownInputRenameVariableMetadata = z.infer<
  typeof ExecutionQueueItemDropdownInputRenameVariableMetadata
>

export const ExecutionQueueItemDateInputMetadata = z.object({
  _tag: z.literal('date-input'),
})
export type ExecutionQueueItemDateInputMetadata = z.infer<
  typeof ExecutionQueueItemDateInputMetadata
>

export const ExecutionQueueItemPivotTableMetadata = z.object({
  _tag: z.literal('pivot-table'),
})
export type ExecutionQueueItemPivotTableMetadata = z.infer<
  typeof ExecutionQueueItemPivotTableMetadata
>

export const ExecutionQueueItemPivotTableLoadPageMetadata = z.object({
  _tag: z.literal('pivot-table-load-page'),
})
export type ExecutionQueueItemPivotTableLoadPageMetadata = z.infer<
  typeof ExecutionQueueItemPivotTableLoadPageMetadata
>

export const ExecutionQueueItemNoopMetadata = z.object({
  _tag: z.literal('noop'),
})
export type ExecutionQueueItemNoopMetadata = z.infer<
  typeof ExecutionQueueItemNoopMetadata
>

export const ExecutionQueueItemMetadata = z.union([
  ExecutionQueueItemPythonMetadata,
  ExecutionQueueItemSQLMetadata,
  ExecutionQueueItemSQLRenameDataframeMetadata,
  ExecutionQueueItemVisualizationMetadata,
  ExecutionQueueItemTextInputSaveValueMetadata,
  ExecutionQueueItemTextInputRenameVariableMetadata,
  ExecutionQueueItemDateInputMetadata,
  ExecutionQueueItemDropdownInputSaveValueMetadata,
  ExecutionQueueItemDropdownInputRenameVariableMetadata,
  ExecutionQueueItemPivotTableMetadata,
  ExecutionQueueItemPivotTableLoadPageMetadata,
  ExecutionQueueItemNoopMetadata,
])
export type ExecutionQueueItemMetadata = z.infer<
  typeof ExecutionQueueItemMetadata
>

export type ExecutionQueueItemMetadataWithoutNoop = Exclude<
  ExecutionQueueItemMetadata,
  ExecutionQueueItemNoopMetadata
>

export const ExecutionQueueItemAttrs = z.object({
  blockId: uuidSchema,
  userId: z.nullable(uuidSchema),
  status: ExecutionQueueItemStatus,
  metadata: ExecutionQueueItemMetadata,
})
export type YExecutionQueueItemAttrs = z.infer<typeof ExecutionQueueItemAttrs>

export type YExecutionQueueItem = Y.XmlElement<YExecutionQueueItemAttrs>

export function createYExecutionQueueItem(
  blockId: string,
  userId: string | null,
  metadata: ExecutionQueueItemMetadataWithoutNoop
): YExecutionQueueItem {
  const el = new Y.XmlElement<YExecutionQueueItemAttrs>()
  const attrs: YExecutionQueueItemAttrs = {
    blockId,
    userId,
    status: { _tag: 'enqueued' },
    metadata,
  }
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(
      // @ts-ignore
      key,
      value
    )
  }
  return el
}

export type MetadataCallbacks<T> = {
  python: (metadata: ExecutionQueueItemPythonMetadata) => T
  sql: (metadata: ExecutionQueueItemSQLMetadata) => T
}

export class ExecutionQueueItem {
  private constructor(private readonly item: YExecutionQueueItem) {}
  private statusObservers: Set<(status: ExecutionQueueItemStatus) => void> =
    new Set()

  public isComplete(): boolean {
    switch (this.getStatus()._tag) {
      case 'completed':
        return true
      case 'enqueued':
      case 'running':
      case 'aborting':
      case 'unknown':
        return false
    }
  }

  public getMetadata(): ExecutionQueueItemMetadata {
    return this.item.getAttribute('metadata') ?? { _tag: 'noop' }
  }

  public getBlockId(): string {
    return this.item.getAttribute('blockId') ?? ''
  }

  public setRunning(): void {
    this.item.setAttribute('status', { _tag: 'running' })
  }

  public setAborting(): void {
    this.item.setAttribute('status', { _tag: 'aborting' })
  }

  public setCompleted(): void {
    this.item.setAttribute('status', { _tag: 'completed' })
  }

  public getStatus(): ExecutionQueueItemStatus {
    const raw = this.item.getAttribute('status')
    if (!raw) {
      return { _tag: 'unknown' }
    }

    const parsed = ExecutionQueueItemStatus.safeParse(raw)
    if (!parsed.success) {
      return { _tag: 'unknown' }
    }

    return parsed.data
  }

  public observeStatus(
    callback: (status: ExecutionQueueItemStatus) => void
  ): () => void {
    this.statusObservers.add(callback)
    if (this.statusObservers.size === 1) {
      this.item.observeDeep(this.onStatusObservation)
    }

    return () => {
      this.statusObservers.delete(callback)
      if (this.statusObservers.size === 0) {
        this.item.unobserveDeep(this.onStatusObservation)
      }
    }
  }

  public toJSON() {
    return this.item.getAttributes()
  }

  private onStatusObservation = () => {
    const status = this.getStatus()
    this.statusObservers.forEach((cb) => cb(status))
  }

  public static fromYjs(item: YExecutionQueueItem): ExecutionQueueItem {
    return new ExecutionQueueItem(item)
  }
}
