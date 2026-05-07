export const DATA_MODEL_JSON_SCHEMA = {
  name: 'arkiv_data_model',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: {
        type: 'string',
        description: 'Short title for the generated data model',
      },
      summary: {
        type: 'string',
        description: 'Concise summary of the model and its key relationships',
      },
      deploymentOrder: {
        type: 'array',
        description: 'Topologically valid deployment order for the entities',
        items: {
          type: 'string',
        },
      },
      deploymentNotes: {
        type: 'array',
        description: 'Short notes about relationship assumptions and deployment caveats',
        items: {
          type: 'string',
        },
      },
      entities: {
        type: 'array',
        description: 'All deployable entities in the application model',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: {
              type: 'string',
              description: 'Entity name using identifier-safe naming',
            },
            expirationDuration: {
              type: 'string',
              enum: ['1d', '7d', '30d', '90d', '365d'],
              description: 'Expiration duration for the entity',
            },
            indexedAttributes: {
              type: 'array',
              description: 'Searchable on-chain fields for this entity',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  name: {
                    type: 'string',
                    description: 'Indexed attribute name',
                  },
                  type: {
                    type: 'string',
                    enum: ['indexedString', 'indexedNumber'],
                    description: 'Indexed attribute type',
                  },
                  value: {
                    description: 'Initial attribute value',
                    anyOf: [{ type: 'string' }, { type: 'number' }],
                  },
                },
                required: ['name', 'type', 'value'],
              },
            },
            dataFields: {
              type: 'array',
              description: 'Bootstrap payload fields stored in the entity payload',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  key: {
                    type: 'string',
                    description: 'Payload field key',
                  },
                  value: {
                    type: 'string',
                    description: 'Payload field value',
                  },
                },
                required: ['key', 'value'],
              },
            },
          },
          required: ['name', 'expirationDuration', 'indexedAttributes', 'dataFields'],
        },
      },
      relations: {
        type: 'array',
        description: 'Explicit cross-entity dependencies',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            sourceEntity: {
              type: 'string',
              description: 'Parent entity that must exist first',
            },
            targetEntity: {
              type: 'string',
              description: 'Dependent child entity',
            },
            fieldName: {
              type: 'string',
              description: 'Foreign-key field stored on the target entity',
            },
          },
          required: ['sourceEntity', 'targetEntity', 'fieldName'],
        },
      },
    },
    required: [
      'title',
      'summary',
      'deploymentOrder',
      'deploymentNotes',
      'entities',
      'relations',
    ],
  },
} as const
