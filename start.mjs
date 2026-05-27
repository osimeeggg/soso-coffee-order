import { HOST, PORT, server } from "./server.js";

server.listen(PORT, HOST, () => {
  console.log(`소소 커피 주문 앱: http://localhost:${PORT}`);
});
