// Deno HTTP Proxy for SOCAPI - forwards requests and injects API key
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const API_KEY = Deno.env.get("SOCAPI_API_KEY") || "";
const TARGET_HOST = "socapi.icu";

const port = parseInt(Deno.env.get("PORT") || "8000");

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
      },
    });
  }

  // Parse the incoming URL and forward to socapi
  const url = new URL(req.url);
  const targetUrl = `https://${TARGET_HOST}${url.pathname}${url.search}`;

  // Copy headers, but inject our API key
  const headers = new Headers(req.headers);
  headers.set("X-Api-Key", API_KEY);
  headers.delete("Host");  // Clean up for target

  // Forward the request
  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: req.body,
  });

  // Copy response headers (with CORS)
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
}, { port });

console.log(`Proxy running on port ${port}`);
