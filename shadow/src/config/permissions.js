// config/permissions.js
module.exports = {
  "super-admin": ["*"],

  admin: [
    "school:create",
    "school:read",
    "school:update",
    "user:invite",
    "class:create",
    "class:update",
  ],

  teacher: [
    "class:read",
    "student:read",
    "grade:create",
  ],

  parent: ["student:read"],
};
