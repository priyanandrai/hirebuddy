import prisma from "../utils/prisma.js";

export const getUsersWithTasksAssigned = async (helperId) => {
    console.log(" ia m calling");
    
  const tasks = await prisma.task.findMany({
    where: {
      assignedToId: helperId,
    },
    select: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  console.log("taskfdgdfdstasks",tasks);
  

  // Deduplicate users & count tasks
  const userMap = {};

  tasks.forEach(({ createdBy }) => {
    if (!userMap[createdBy.id]) {
      userMap[createdBy.id] = {
        id: createdBy.id,
        name: createdBy.name,
        taskCount: 1,
      };
    } else {
      userMap[createdBy.id].taskCount += 1;
    }
  });

  return Object.values(userMap);
};



