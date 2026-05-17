import type { SchemaObject } from 'openapi3-ts/oas31';

export type OpenAPISchemas = Record<string, SchemaObject>;

export function createSchemas(schemas: OpenAPISchemas): OpenAPISchemas {
  return schemas;
}
