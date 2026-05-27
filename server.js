import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const runtimeEnv = typeof process === "undefined" ? {} : process.env;
const HOST = runtimeEnv.HOST || "0.0.0.0";
const PORT = Number(runtimeEnv.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const orderFile = path.join(dataDir, "orders.json");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function json(response, statusCode, body) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function ensureData() {
  await fs.promises.mkdir(dataDir, { recursive: true });
  try {
    await fs.promises.access(orderFile);
  } catch {
    await fs.promises.writeFile(orderFile, JSON.stringify({ orders: {} }, null, 2), "utf8");
  }
}

async function readOrders() {
  await ensureData();
  const raw = await fs.promises.readFile(orderFile, "utf8");
  return JSON.parse(raw);
}

async function writeOrder(memberId, order) {
  const data = await readOrders();
  data.orders[memberId] = {
    ...order,
    memberId,
    updatedAt: new Date().toISOString(),
  };
  await fs.promises.writeFile(orderFile, JSON.stringify(data, null, 2), "utf8");
  return data.orders[memberId];
}

async function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100_000) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", reject);
  });
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const relativePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, relativePath);

  if (!filePath.startsWith(publicDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) {
      throw new Error("Not a file");
    }
    const contentType = contentTypes[path.extname(filePath)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("페이지를 찾을 수 없습니다.");
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    if (url.pathname === "/api/orders" && request.method === "GET") {
      json(response, 200, await readOrders());
      return;
    }

    const memberMatch = url.pathname.match(/^\/api\/orders\/([a-z0-9-]+)$/);
    if (memberMatch && request.method === "PUT") {
      const body = await parseBody(request);
      if (!body.menuId || !body.memberName || !body.menuName) {
        json(response, 400, { error: "필수 주문 항목이 없습니다." });
        return;
      }
      const savedOrder = await writeOrder(memberMatch[1], body);
      json(response, 200, savedOrder);
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      json(response, 404, { error: "요청을 찾을 수 없습니다." });
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    console.error(error);
    json(response, 500, { error: "저장 중 문제가 발생했습니다." });
  }
});

export { HOST, PORT, server };
