const authRoutes = require('./modules/auth/auth.routes');
const auditRoutes = require('./modules/audit/audit.routes');
const schoolRoutes = require('./modules/schools/school.routes');

module.exports = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/schools', schoolRoutes);
};
