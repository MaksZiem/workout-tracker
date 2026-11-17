"use client";

import createClient from "openapi-fetch";
import type { ApiPaths } from "./paths";

export const clientApi = createClient<ApiPaths>({
  baseUrl: "/api/backend",
});
