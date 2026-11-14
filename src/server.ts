import { app } from "./app.js";
import { ENV } from "./config/env.js";
import { connectDatabase } from "./config/db.js";

const startServer = async () => {
  await connectDatabase();
  app.listen(ENV.PORT, () => {
    console.log(`📡 [Server] Berjalan di mode ${ENV.NODE_ENV} pada port ${ENV.PORT}`);
  });
};

startServer();

export default app;
