async function getList(database, { id }) {
  const result = await database.all(
    `select * from todolist where userId = ? order by state desc `,
    [id]
  );
  return result;
}

async function addTask(databse, { text, state, userId }) {
  try {
    const data = await databse.run(
      "insert into todolist (text, state, userId) values (?, ?, ?)",
      [text, state, userId]
    );
    return {
      error: 0,
      data,
    };
  } catch (err) {
    return {
      error: 1,
      data: err,
    };
  }
}

async function updateTask(database, { id, state, userId }) {
  try {
    const data = await database.run(
      "update todolist set state = ?, userId = ? where id = ?",
      [state, userId, id]
    );
    return {
      error: 0,
      data,
    };
  } catch (err) {
    return {
      error: 1,
      data: err,
    };
  }
}

module.exports = {
  getList,
  addTask,
  updateTask,
};
