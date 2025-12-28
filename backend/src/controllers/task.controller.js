const prisma = require('../utils/prisma');

exports.createTask = async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user.id;

  const task = await prisma.task.create({
    data: {
      title,
      description,
      userId,
    },
  });

  res.json(task);
};
