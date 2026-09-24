import type { paths } from "./schema";
import type { ResponseOverrides } from "./extra-types";

type SuccessStatus = 200 | 201;

type OverrideOperation<Op, T> = Op extends { responses: infer R }
  ? Omit<Op, "responses"> & {
      responses: {
        [S in keyof R]: S extends SuccessStatus
          ? Omit<R[S], "content"> & { content: { "application/json": T } }
          : R[S];
      };
    }
  : Op;

/**
 * Ścieżki z OpenAPI, w których odpowiedzi 2xx typu `unknown` zastąpiono
 * ręcznymi typami z ResponseOverrides. To jest typ podawany do openapi-fetch.
 */
export type ApiPaths = {
  [P in keyof paths]: P extends keyof ResponseOverrides
    ? {
        [M in keyof paths[P]]: M extends "get" | "post" | "patch" | "put" | "delete"
          ? OverrideOperation<paths[P][M], ResponseOverrides[P]>
          : paths[P][M];
      }
    : paths[P];
};
