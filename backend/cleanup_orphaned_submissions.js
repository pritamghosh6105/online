const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Submission = require('./models/Submission');
const User = require('./models/User');
const Exam = require('./models/Exam');

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const submissions = await Submission.find()
    .populate('student', '_id')
    .populate('exam', '_id')
    .lean();

  const orphanedIds = submissions
    .filter(sub => !sub.student || !sub.exam)
    .map(sub => sub._id);

  console.log(`Found ${orphanedIds.length} orphaned submission records to remove.`);

  if (orphanedIds.length > 0) {
    const result = await Submission.deleteMany({ _id: { $in: orphanedIds } });
    console.log(`Successfully deleted ${result.deletedCount} orphaned submissions from DB.`);
  }

  const remaining = await Submission.countDocuments();
  console.log(`Remaining total valid submissions in DB: ${remaining}`);
  process.exit(0);
}

cleanup().catch(err => {
  console.error(err);
  process.exit(1);
});
