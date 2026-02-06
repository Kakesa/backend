const authRoutes = require('./modules/auth/auth.routes');
const auditRoutes = require('./modules/audit/audit.routes');
const schoolRoutes = require('./modules/schools/school.routes');
const superAdminRoutes = require('./modules/superadmin/superadmin.routes');
const subscriptionRoutes = require('./modules/subscriptions/subscription.routes');
const studentRoutes = require('./modules/students/student.routes');
const classRoutes = require('./modules/classes/class.routes');

module.exports = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/schools', schoolRoutes);
  app.use('/api/superadmin', superAdminRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/classes', classRoutes);
};
