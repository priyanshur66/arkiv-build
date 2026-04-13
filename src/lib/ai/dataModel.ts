import type { SchemaEdge, SchemaNode } from '@/store/useSchemaStore'
import type {
  EntityDataField,
  EntityField,
  ExpirationDuration,
  IndexedAttributeType,
} from '@/lib/arkiv/types'

const EXPIRATION_DURATIONS: ExpirationDuration[] = ['1d', '7d', '30d', '90d', '365d']
const ENTITY_START_X = 96
const ENTITY_START_Y = 140
const ENTITY_HORIZONTAL_GAP = 600
const ENTITY_VERTICAL_GAP = 320

export type GeneratedIndexedAttribute = {
  name: string
  type: IndexedAttributeType
  value: string | number
}

export type GeneratedDataField = {
  key: string
  value: string
}

export type GeneratedEntity = {
  name: string
  expirationDuration: ExpirationDuration
  indexedAttributes: GeneratedIndexedAttribute[]
  dataFields: GeneratedDataField[]
}

export type GeneratedRelation = {
  sourceEntity: string
  targetEntity: string
  fieldName: string
}

export type GeneratedDataModel = {
  title: string
  summary: string
  deploymentOrder: string[]
  deploymentNotes: string[]
  entities: GeneratedEntity[]
  relations: GeneratedRelation[]
}

export type DataModelGenerationMode = 'create' | 'edit'

type NamedGeneratedEntity = GeneratedEntity & {
  schemaName: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const sanitizeIdentifier = (value: string) =>
  value
    .replace(/\s+/g, '_')
    .replace(/^[^\p{L}_]+/u, '')
    .replace(/[^\p{L}\p{N}_]/gu, '')

const ensureString = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback

const stringifyScalar = (value: unknown) => {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return JSON.stringify(value ?? '')
}

const ensureStringArray = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => ensureString(item).trim()).filter(Boolean) : []

const ensureExpirationDuration = (value: unknown): ExpirationDuration =>
  typeof value === 'string' && EXPIRATION_DURATIONS.includes(value as ExpirationDuration)
    ? (value as ExpirationDuration)
    : '30d'

const ensureIndexedAttributeType = (value: unknown): IndexedAttributeType =>
  value === 'indexedNumber' ? 'indexedNumber' : 'indexedString'

const normalizeGeneratedEntity = (
  value: unknown,
  index: number,
): GeneratedEntity => {
  if (!isRecord(value)) {
    throw new Error(`Entity ${index + 1} is not an object.`)
  }

  const indexedAttributes = Array.isArray(value.indexedAttributes)
    ? value.indexedAttributes
        .filter(isRecord)
        .map((attribute, attributeIndex) => ({
          name:
            sanitizeIdentifier(ensureString(attribute.name).trim()) ||
            `field_${attributeIndex + 1}`,
          type: ensureIndexedAttributeType(attribute.type),
          value:
            typeof attribute.value === 'number'
              ? attribute.value
              : stringifyScalar(attribute.value).trim(),
        }))
    : []

  const dataFields = Array.isArray(value.dataFields)
    ? value.dataFields
        .filter(isRecord)
        .map((field, fieldIndex) => ({
          key:
            sanitizeIdentifier(ensureString(field.key).trim()) ||
            `data_${fieldIndex + 1}`,
          value: stringifyScalar(field.value),
        }))
    : []

  return {
    name: ensureString(value.name).trim() || `Entity_${index + 1}`,
    expirationDuration: ensureExpirationDuration(value.expirationDuration),
    indexedAttributes,
    dataFields,
  }
}

const normalizeGeneratedRelation = (
  value: unknown,
): GeneratedRelation | null => {
  if (!isRecord(value)) {
    return null
  }

  const sourceEntity = ensureString(value.sourceEntity).trim()
  const targetEntity = ensureString(value.targetEntity).trim()
  const fieldName = sanitizeIdentifier(ensureString(value.fieldName).trim())

  if (!sourceEntity || !targetEntity || !fieldName) {
    return null
  }

  return {
    sourceEntity,
    targetEntity,
    fieldName,
  }
}

export const normalizeGeneratedDataModel = (value: unknown): GeneratedDataModel => {
  if (!isRecord(value)) {
    throw new Error('The AI response was not a JSON object.')
  }

  const entities = Array.isArray(value.entities)
    ? value.entities.map(normalizeGeneratedEntity).filter((entity) => entity.name.trim().length > 0)
    : []

  if (entities.length === 0) {
    throw new Error('The AI response did not include any entities.')
  }

  const relations = Array.isArray(value.relations)
    ? value.relations
        .map(normalizeGeneratedRelation)
        .filter((relation): relation is GeneratedRelation => relation !== null)
    : []

  return {
    title: ensureString(value.title, 'Generated Arkiv data model').trim() || 'Generated Arkiv data model',
    summary:
      ensureString(value.summary).trim() ||
      'Deployment-ready Arkiv draft entities generated from the use case.',
    deploymentOrder: ensureStringArray(value.deploymentOrder),
    deploymentNotes: ensureStringArray(value.deploymentNotes),
    entities,
    relations,
  }
}

const extractEntityDataFields = (node: SchemaNode): GeneratedDataField[] => {
  if (node.data.mode === 'draft') {
    return (node.data.dataFields ?? [])
      .filter((field) => field.key.trim().length > 0 || field.value.trim().length > 0)
      .map((field) => ({
        key: field.key,
        value: field.value,
      }))
  }

  if (!node.data.entityData) {
    return []
  }

  try {
    const parsed = JSON.parse(node.data.entityData) as unknown
    if (!isRecord(parsed)) {
      return [{ key: 'payload', value: node.data.entityData }]
    }

    return Object.entries(parsed).map(([key, value]) => ({
      key,
      value: stringifyScalar(value),
    }))
  } catch {
    return [{ key: 'payload', value: node.data.entityData }]
  }
}

export const hasMeaningfulCanvasModel = (
  nodes: SchemaNode[],
  edges: SchemaEdge[],
) => {
  if (edges.length > 0) {
    return true
  }

  return nodes.some((node) => {
    if (node.data.mode === 'persisted') {
      return true
    }

    const hasLabel = node.data.label.trim().length > 0
    const hasFields = node.data.fields.some(
      (field) => field.name.trim().length > 0 || field.value.trim().length > 0,
    )
    const hasDataFields = (node.data.dataFields ?? []).some(
      (field) => field.key.trim().length > 0 || field.value.trim().length > 0,
    )

    return hasLabel || hasFields || hasDataFields
  })
}

export const serializeCanvasToGeneratedDataModel = (
  nodes: SchemaNode[],
  edges: SchemaEdge[],
): GeneratedDataModel => {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const relations = edges
    .map((edge) => {
      const sourceNode = nodeById.get(edge.source)
      const targetNode = nodeById.get(edge.target)

      if (!sourceNode || !targetNode) {
        return null
      }

      const relationField = targetNode.data.fields.find((field) => field.edgeId === edge.id)

      return {
        sourceEntity: sourceNode.data.label || sourceNode.id,
        targetEntity: targetNode.data.label || targetNode.id,
        fieldName:
          relationField?.name ||
          `${sanitizeIdentifier(sourceNode.data.label || 'parent').toLowerCase()}Id`,
      }
    })
    .filter((relation): relation is GeneratedRelation => relation !== null)

  const entities = nodes.map((node, index) => ({
    name: node.data.label.trim() || `Entity_${index + 1}`,
    expirationDuration: node.data.expirationDuration,
    indexedAttributes: node.data.fields.map((field) => ({
      name: field.name,
      type: field.type,
      value:
        field.type === 'indexedNumber' && Number.isFinite(Number(field.value))
          ? Number(field.value)
          : field.value,
    })),
    dataFields: extractEntityDataFields(node),
  }))

  return {
    title: 'Current canvas model',
    summary: 'The current Arkiv model already on the canvas.',
    deploymentOrder: entities.map((entity) => entity.name),
    deploymentNotes: [],
    entities,
    relations,
  }
}

const createField = (
  name: string,
  type: IndexedAttributeType,
  value: string,
): EntityField => ({
  id: `field-${crypto.randomUUID()}`,
  name,
  type,
  value,
})

const createDataField = (key: string, value: string): EntityDataField => ({
  id: `data-${crypto.randomUUID()}`,
  key,
  value,
})

const createUniqueEdgeId = (
  sourceNodeId: string,
  targetNodeId: string,
  edgeName: string,
  seenEdgeIds: Set<string>,
) => {
  const baseEdgeId = `xy-edge__${sourceNodeId}-null-${targetNodeId}-null-${sanitizeIdentifier(edgeName) || 'relation'}`

  if (!seenEdgeIds.has(baseEdgeId)) {
    seenEdgeIds.add(baseEdgeId)
    return baseEdgeId
  }

  let suffix = 2
  let nextEdgeId = `${baseEdgeId}-${suffix}`

  while (seenEdgeIds.has(nextEdgeId)) {
    suffix += 1
    nextEdgeId = `${baseEdgeId}-${suffix}`
  }

  seenEdgeIds.add(nextEdgeId)
  return nextEdgeId
}

const dedupeEntityNames = (entities: GeneratedEntity[]): NamedGeneratedEntity[] => {
  const seen = new Set<string>()

  return entities.map((entity, index) => {
    const baseName = sanitizeIdentifier(entity.name) || `Entity_${index + 1}`
    let schemaName = baseName
    let suffix = 2

    while (seen.has(schemaName.toLowerCase())) {
      schemaName = `${baseName}_${suffix}`
      suffix += 1
    }

    seen.add(schemaName.toLowerCase())

    return {
      ...entity,
      schemaName,
    }
  })
}

const buildEntityLookup = (entities: NamedGeneratedEntity[]) => {
  const lookup = new Map<string, NamedGeneratedEntity>()

  entities.forEach((entity) => {
    lookup.set(entity.name.trim().toLowerCase(), entity)
    lookup.set(entity.schemaName.trim().toLowerCase(), entity)
  })

  return lookup
}

const calculateEntityLevels = (
  entities: NamedGeneratedEntity[],
  relations: GeneratedRelation[],
) => {
  const lookup = buildEntityLookup(entities)
  const incomingRelations = new Map<string, string[]>()
  const levels = new Map<string, number>()

  relations.forEach((relation) => {
    const source = lookup.get(relation.sourceEntity.trim().toLowerCase())
    const target = lookup.get(relation.targetEntity.trim().toLowerCase())

    if (!source || !target) {
      return
    }

    const currentParents = incomingRelations.get(target.schemaName) ?? []
    currentParents.push(source.schemaName)
    incomingRelations.set(target.schemaName, currentParents)
  })

  const getLevel = (schemaName: string, trail = new Set<string>()): number => {
    const existingLevel = levels.get(schemaName)
    if (existingLevel !== undefined) {
      return existingLevel
    }

    if (trail.has(schemaName)) {
      return 0
    }

    const parentNames = incomingRelations.get(schemaName) ?? []
    if (parentNames.length === 0) {
      levels.set(schemaName, 0)
      return 0
    }

    const nextTrail = new Set(trail)
    nextTrail.add(schemaName)

    const level =
      Math.max(...parentNames.map((parentName) => getLevel(parentName, nextTrail))) + 1

    levels.set(schemaName, level)
    return level
  }

  entities.forEach((entity) => {
    getLevel(entity.schemaName)
  })

  return levels
}

const calculateDescendantCounts = (
  entities: NamedGeneratedEntity[],
  relations: GeneratedRelation[],
) => {
  const lookup = buildEntityLookup(entities)
  const childMap = new Map<string, Set<string>>(
    entities.map((entity) => [entity.schemaName, new Set<string>()]),
  )

  relations.forEach((relation) => {
    const source = lookup.get(relation.sourceEntity.trim().toLowerCase())
    const target = lookup.get(relation.targetEntity.trim().toLowerCase())

    if (!source || !target || source.schemaName === target.schemaName) {
      return
    }

    childMap.get(source.schemaName)?.add(target.schemaName)
  })

  const memo = new Map<string, number>()

  const getDescendantCount = (schemaName: string, trail = new Set<string>()) => {
    const existing = memo.get(schemaName)
    if (existing !== undefined) {
      return existing
    }

    if (trail.has(schemaName)) {
      return 0
    }

    const nextTrail = new Set(trail)
    nextTrail.add(schemaName)

    const descendants = childMap.get(schemaName) ?? new Set<string>()

    const total =
      Array.from(descendants).reduce(
        (sum, childName) => sum + 1 + getDescendantCount(childName, nextTrail),
        0,
      )

    memo.set(schemaName, total)
    return total
  }

  entities.forEach((entity) => {
    getDescendantCount(entity.schemaName)
  })

  return memo
}

const calculateIncomingParents = (
  entities: NamedGeneratedEntity[],
  relations: GeneratedRelation[],
) => {
  const lookup = buildEntityLookup(entities)
  const parentMap = new Map<string, string[]>(entities.map((entity) => [entity.schemaName, []]))

  relations.forEach((relation) => {
    const source = lookup.get(relation.sourceEntity.trim().toLowerCase())
    const target = lookup.get(relation.targetEntity.trim().toLowerCase())

    if (!source || !target) {
      return
    }

    parentMap.get(target.schemaName)?.push(source.schemaName)
  })

  return parentMap
}

const buildGeneratedLayout = (
  entities: NamedGeneratedEntity[],
  relations: GeneratedRelation[],
  levels: Map<string, number>,
) => {
  const levelGroups = new Map<number, NamedGeneratedEntity[]>()
  const descendantCounts = calculateDescendantCounts(entities, relations)
  const parentMap = calculateIncomingParents(entities, relations)
  const yPositions = new Map<string, number>()

  entities.forEach((entity) => {
    const level = levels.get(entity.schemaName) ?? 0
    if (!levelGroups.has(level)) {
      levelGroups.set(level, [])
    }
    levelGroups.get(level)?.push(entity)
  })

  Array.from(levelGroups.entries())
    .sort(([leftLevel], [rightLevel]) => leftLevel - rightLevel)
    .forEach(([level, levelEntities]) => {
      const orderedEntities = [...levelEntities].sort((left, right) => {
        const leftParents = parentMap.get(left.schemaName) ?? []
        const rightParents = parentMap.get(right.schemaName) ?? []

        const leftAnchor =
          leftParents.length > 0
            ? leftParents.reduce((sum, parentName) => sum + (yPositions.get(parentName) ?? ENTITY_START_Y), 0) /
              leftParents.length
            : ENTITY_START_Y
        const rightAnchor =
          rightParents.length > 0
            ? rightParents.reduce((sum, parentName) => sum + (yPositions.get(parentName) ?? ENTITY_START_Y), 0) /
              rightParents.length
            : ENTITY_START_Y

        const anchorDiff = leftAnchor - rightAnchor
        if (Math.abs(anchorDiff) > 1) {
          return anchorDiff
        }

        const descendantDiff =
          (descendantCounts.get(right.schemaName) ?? 0) -
          (descendantCounts.get(left.schemaName) ?? 0)
        if (descendantDiff !== 0) {
          return descendantDiff
        }

        return left.schemaName.localeCompare(right.schemaName)
      })

      orderedEntities.forEach((entity, index) => {
        const parentNames = parentMap.get(entity.schemaName) ?? []
        const anchoredY =
          parentNames.length > 0
            ? parentNames.reduce((sum, parentName) => sum + (yPositions.get(parentName) ?? ENTITY_START_Y), 0) /
              parentNames.length
            : ENTITY_START_Y + index * ENTITY_VERTICAL_GAP
        const previousEntity = orderedEntities[index - 1]
        const minimumY = previousEntity
          ? (yPositions.get(previousEntity.schemaName) ?? ENTITY_START_Y) + ENTITY_VERTICAL_GAP
          : ENTITY_START_Y

        yPositions.set(entity.schemaName, Math.max(anchoredY, minimumY))
      })

      if (level === 0 && orderedEntities.length > 0) {
        orderedEntities.forEach((entity, index) => {
          yPositions.set(entity.schemaName, ENTITY_START_Y + index * ENTITY_VERTICAL_GAP)
        })
      }
    })

  return new Map(
    entities.map((entity) => [
      entity.schemaName,
      {
        x: ENTITY_START_X + (levels.get(entity.schemaName) ?? 0) * ENTITY_HORIZONTAL_GAP,
        y: yPositions.get(entity.schemaName) ?? ENTITY_START_Y,
      },
    ]),
  )
}

export const buildSchemaGraphFromGeneratedModel = (
  model: GeneratedDataModel,
): { nodes: SchemaNode[]; edges: SchemaEdge[] } => {
  const namedEntities = dedupeEntityNames(model.entities)
  const lookup = buildEntityLookup(namedEntities)
  const levels = calculateEntityLevels(namedEntities, model.relations)
  const layout = buildGeneratedLayout(namedEntities, model.relations, levels)

  const nodes: SchemaNode[] = []
  const edges: SchemaEdge[] = []
  const nodeMap = new Map<string, SchemaNode>()
  const seenEdgeIds = new Set<string>()
  let selectedNodeId: string | undefined

  namedEntities
    .sort((left, right) => {
      const leftPosition = layout.get(left.schemaName)
      const rightPosition = layout.get(right.schemaName)

      if (!leftPosition || !rightPosition) {
        return left.schemaName.localeCompare(right.schemaName)
      }

      if (leftPosition.x !== rightPosition.x) {
        return leftPosition.x - rightPosition.x
      }

      return leftPosition.y - rightPosition.y
    })
    .forEach((entity) => {
      const nodeId = `entity-${crypto.randomUUID()}`
      const fields = entity.indexedAttributes.map((attribute) =>
        createField(
          sanitizeIdentifier(attribute.name) || 'field',
          attribute.type,
          String(attribute.value ?? ''),
        ),
      )
      const dataFields = entity.dataFields.map((field) =>
        createDataField(
          sanitizeIdentifier(field.key) || 'data',
          field.value,
        ),
      )
      const position = layout.get(entity.schemaName) ?? {
        x: ENTITY_START_X,
        y: ENTITY_START_Y,
      }

      const node: SchemaNode = {
        id: nodeId,
        type: 'entity',
        position,
        data: {
          mode: 'draft',
          label: entity.schemaName,
          expirationDuration: entity.expirationDuration,
          fields,
          dataFields,
        },
        selected: selectedNodeId === undefined,
      }

      if (!selectedNodeId) {
        selectedNodeId = nodeId
      }

      nodes.push(node)
      nodeMap.set(entity.schemaName, node)
    })

  model.relations.forEach((relation) => {
    const sourceEntity = lookup.get(relation.sourceEntity.trim().toLowerCase())
    const targetEntity = lookup.get(relation.targetEntity.trim().toLowerCase())

    if (!sourceEntity || !targetEntity) {
      return
    }

    const sourceNode = nodeMap.get(sourceEntity.schemaName)
    const targetNode = nodeMap.get(targetEntity.schemaName)

    if (!sourceNode || !targetNode) {
      return
    }

    const relationFieldName =
      sanitizeIdentifier(relation.fieldName) ||
      `${sourceEntity.schemaName.charAt(0).toLowerCase()}${sourceEntity.schemaName.slice(1)}Id`
    const edgeId = createUniqueEdgeId(
      sourceNode.id,
      targetNode.id,
      relationFieldName,
      seenEdgeIds,
    )

    const existingField = targetNode.data.fields.find(
      (field) => field.name.toLowerCase() === relationFieldName.toLowerCase(),
    )

    if (existingField) {
      existingField.type = 'indexedString'
      existingField.value = ''
      existingField.edgeId = edgeId
      existingField.relationNodeId = sourceNode.id
    } else {
      targetNode.data.fields.push({
        ...createField(relationFieldName, 'indexedString', ''),
        edgeId,
        relationNodeId: sourceNode.id,
      })
    }

    edges.push({
      id: edgeId,
      source: sourceNode.id,
      target: targetNode.id,
      sourceHandle: undefined,
      targetHandle: undefined,
      animated: true,
    })
  })

  if (selectedNodeId) {
    nodes.forEach((node) => {
      node.selected = node.id === selectedNodeId
    })
  }

  return { nodes, edges }
}
