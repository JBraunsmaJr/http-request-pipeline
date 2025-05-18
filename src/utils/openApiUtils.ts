import { OpenAPIV3 } from 'openapi-types';
import OpenAPISchemaValidator from 'openapi-schema-validator';
import type {ApiEndpoint, ExternalService} from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parse an OpenAPI document from a file
 */
export const parseOpenApiDocument = async (file: File): Promise<OpenAPIV3.Document> => {
  try {
    const text = await file.text();
    const json = JSON.parse(text);

    // Validate the OpenAPI document
    const validator = new OpenAPISchemaValidator({ version: 3 });
    const validation = validator.validate(json);

    if (validation.errors && validation.errors.length > 0) {
      throw new Error(`OpenAPI validation errors: ${JSON.stringify(validation.errors)}`);
    }

    return json as OpenAPIV3.Document;
  } catch (error) {
    console.error('Error parsing OpenAPI document:', error);
    throw new Error('Invalid OpenAPI document');
  }
};

/**
 * Create a new external service from an OpenAPI document
 */
export const createExternalService = (
  name: string,
  description: string,
  openApiDocument: OpenAPIV3.Document
): ExternalService => {
  return {
    id: uuidv4(),
    name,
    description,
    openApiDocument
  };
};

/**
 * Extract API endpoints from an OpenAPI document
 */
export const extractApiEndpoints = (
  serviceId: string,
  openApiDocument: OpenAPIV3.Document
): ApiEndpoint[] => {
  const endpoints: ApiEndpoint[] = [];

  // Iterate through all paths and methods
  const paths = openApiDocument.paths || {};
  Object.entries(paths).forEach(([path, pathItem]) => {
    if (!pathItem) return;

    // Process each HTTP method (GET, POST, etc.)
    const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const;
    methods.forEach(method => {
      const operation = pathItem[method];
      if (!operation) return;

      const endpoint: ApiEndpoint = {
        serviceId,
        path,
        method,
        operationId: operation.operationId,
        summary: operation.summary,
        description: operation.description,
        parameters: operation.parameters as OpenAPIV3.ParameterObject[],
        responses: operation.responses as Record<string, OpenAPIV3.ResponseObject>
      };

      // Add request body if present
      if (operation.requestBody) {
        endpoint.requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
      }

      endpoints.push(endpoint);
    });
  });

  return endpoints;
};

/**
 * Resolve a schema reference
 */
export const resolveSchemaRef = (
  ref: string,
  openApiDocument: OpenAPIV3.Document
): OpenAPIV3.SchemaObject | null => {
  // $ref format is typically "#/components/schemas/SchemaName"
  const refPath = ref.replace('#/', '').split('/');

  let resolved: any = openApiDocument;
  for (const segment of refPath) {
    if (!resolved || typeof resolved !== 'object') {
      return null;
    }
    resolved = resolved[segment];
  }

  // If the resolved schema itself has a $ref, resolve it recursively
  if (resolved && '$ref' in resolved) {
    return resolveSchemaRef(resolved.$ref, openApiDocument);
  }

  return resolved as OpenAPIV3.SchemaObject;
};

/**
 * Get schema properties from a schema object
 */
export const getSchemaProperties = (
  schema?: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  openApiDocument?: OpenAPIV3.Document
): Record<string, OpenAPIV3.SchemaObject> => {
  if (!schema) return {};

  // Handle references
  if ('$ref' in schema) {
    if (!openApiDocument) {
      console.warn('Cannot resolve $ref without OpenAPI document');
      return {};
    }

    const resolvedSchema = resolveSchemaRef(schema.$ref, openApiDocument);
    if (!resolvedSchema) {
      console.warn(`Failed to resolve schema reference: ${schema.$ref}`);
      return {};
    }

    return getSchemaProperties(resolvedSchema, openApiDocument);
  }

  // Handle arrays
  if (schema.type === 'array' && schema.items) {
    if ('$ref' in schema.items) {
      if (!openApiDocument) {
        console.warn('Cannot resolve $ref without OpenAPI document');
        return {};
      }

      const resolvedItems = resolveSchemaRef(schema.items.$ref, openApiDocument);
      if (!resolvedItems) {
        console.warn(`Failed to resolve schema reference: ${schema.items.$ref}`);
        return {};
      }

      return getSchemaProperties(resolvedItems, openApiDocument);
    }
    return getSchemaProperties(schema.items as OpenAPIV3.SchemaObject, openApiDocument);
  }

  // Handle objects
  if (schema.type === 'object' || schema.properties) {
    return schema.properties || {};
  }

  return {};
};
