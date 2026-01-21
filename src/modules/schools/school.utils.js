const Counter = require("./school.counter.model");

const generateSchoolCode = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "school" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const number = String(counter.seq).padStart(4, "0");
  return `EG-${number}`;
};

module.exports = { generateSchoolCode };
