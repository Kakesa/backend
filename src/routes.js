const authRoutes = require('./modules/auth/auth.routes');
const auditRoutes = require('./modules/audit/audit.routes');

module.exports = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/audit', auditRoutes);
};
