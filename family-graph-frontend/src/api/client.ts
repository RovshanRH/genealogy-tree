import { ref } from "vue";

const STORAGE_KEY = "familyGraph.graphqlEndpoint";

function readStoredEndpoint(): string {
  try {
    return (
      localStorage.getItem(STORAGE_KEY) ??
      import.meta.env.VITE_GRAPHQL_URL ??
      ""
    );
  } catch {
    return import.meta.env.VITE_GRAPHQL_URL ?? "";
  }
}

// Реактивный endpoint — используется в EndpointBar.vue и во всех запросах.
export const graphqlEndpoint = ref<string>(readStoredEndpoint());

export function setGraphqlEndpoint(url: string) {
  graphqlEndpoint.value = url.trim();
  try {
    localStorage.setItem(STORAGE_KEY, graphqlEndpoint.value);
  } catch {
    // localStorage может быть недоступен — не критично
  }
}

export class GraphqlError extends Error {}

export async function gqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const endpoint = graphqlEndpoint.value;
  if (!endpoint) {
    throw new GraphqlError(
      "GraphQL endpoint не задан. Укажите URL API в настройках.",
    );
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
  } catch (e) {
    throw new GraphqlError(
      `Не удалось связаться с ${endpoint}: ${(e as Error).message}`,
    );
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new GraphqlError(
      `Сервер ответил не-JSON (HTTP ${res.status}) — проверьте URL endpoint'а.`,
    );
  }

  if (!res.ok && !json?.errors) {
    throw new GraphqlError(`HTTP ${res.status} при запросе к ${endpoint}`);
  }

  if (json?.errors?.length) {
    const message = json.errors.map((e: any) => e.message).join("; ");
    throw new GraphqlError(message);
  }

  return json.data as T;
}
