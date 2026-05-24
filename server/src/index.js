const app = require('./app');
const { getDbStatus } = require('./db');

const PORT = Number(process.env.PORT) || 4000;

if (require.main === module) {
  app.listen(PORT, async () => {
    const db = await getDbStatus();
    if (db.connected) {
      console.log(`✅ API en http://localhost:${PORT}`);
      console.log(
        `   MySQL: ${db.provider.toUpperCase()} → ${db.host}/${db.database} (SSL: ${db.ssl ? 'sí' : 'no'})`
      );
    } else {
      console.log(`⚠️  API en http://localhost:${PORT} (MySQL NO conectado)`);
      console.log(`   Error: ${db.error}`);
    }
  });
}

module.exports = app;
