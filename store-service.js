const Sequelize = require("sequelize");
const { gte } = Sequelize.Op;

var sequelize = new Sequelize('neondb', 'neondb_owner', 'EdB5Cx3VLuwZ', {
    host: 'ep-winter-fire-a5h3kzpm.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});


const Item = sequelize.define("Item", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  itemDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE,
});

const Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

Item.belongsTo(Category, { foreignKey: "categoryId" });


function initialize() {
    return new Promise((resolve, reject) => {
      sequelize.sync()
        .then(() => {
          resolve("Database sync successful");
        })
        .catch((err) => {
          reject("Unable to sync the database: " + err.message);
        });
    });
}

const getPublishedItems = () => {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { published: true },
    })
      .then((itemData) => resolve(itemData))
      .catch(() => reject("no results returned"));
  });
};

const getAllItems = () => {
    return new Promise((resolve, reject) => {
      Item.findAll()
        .then((items) => {
          if (items.length > 0) {
            resolve(items);
          } else {
            reject("no results returned");
          }
        })
        .catch((error) => {
          reject("no results returned: " + error.message);
        });
    });
  };

const getItemsByCategory = (categoryId) => {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        categoryId: categoryId,
      },
    })
      .then((itemData) => {
        if (itemData.length > 0) {
          resolve(itemData);
        } else {
          reject("no results returned");
        }
      })
      .catch((err) => {
        reject("no results returned");
      });
  });
};

const getItemsByMinDate = (minDateStr) => {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        itemDate: {
          [gte]: new Date(minDateStr),
        },
      },
    })
      .then((itemData) => {
        if (itemData.length > 0) {
          resolve(itemData);
        } else {
          reject("no results returned");
        }
      })
      .catch((err) => {
        reject("no results returned");
      });
  });
};

const getItemById = (id) => {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        id: id,
      },
    })
      .then((itemData) => {
        if (itemData.length > 0) {
          resolve(itemData[0]);
        } else {
          reject("no results returned");
        }
      })
      .catch((err) => {
        reject("no results returned");
      });
  });
};
const addItem = (itemData) => {
  return new Promise((resolve, reject) => {
    try {
      itemData.published = Boolean(itemData.published);
      for (const key in itemData) {
        if (itemData[key] === "") {
          itemData[key] = null;
        }
      }
      itemData.itemDate = new Date();

      console.log('Item data to be created:', itemData);

      Item.create(itemData)
        .then(() => resolve())
        .catch(err => {
          console.error('Error creating item:', err);
          reject("Unable to create item: " + err.message);
        });
    } catch (error) {
      console.error('Error processing itemData:', error);
      reject("Unable to process itemData: " + error.message);
    }
  });
};


const getPublishedItemsByCategory = (categoryId) => {
  return Item.findAll({
    where: {
      published: true,
      categoryId: categoryId,
    },
  })
    .then((itemData) =>
      itemData.length > 0 ? itemData : Promise.reject("no results returned")
    )
    .catch(() => Promise.reject("no results returned"));
};

function getCategories() {
    return new Promise((resolve, reject) => {
      Category.findAll()
        .then(categories => {
          if (categories.length === 0) {
            resolve([]); 
          } else {
            resolve(categories);
          }
        })
        .catch(error => {
          reject(new Error("Error retrieving categories: " + error.message));
        });
    });
  }

const addCategory = (categoryData) => {
  return new Promise((resolve, reject) => {
    try {
      for (const key in categoryData) {
        if (categoryData[key] === "") {
          categoryData[key] = null;
        }
      }

      Category.create(categoryData)
        .then(() => resolve())
        .catch((err) => reject("unable to create category: " + err.message));
    } catch (error) {
      reject("unable to read category data: " + error.message);
    }
  });
};

const deleteCategoryById = (id) => {
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: { id: id },
    })
      .then((result) => {
        if (result > 0) {
          resolve();
        } else {
          reject("no category found");
        }
      })
      .catch((err) => reject("unable to delete category: " + err.message));
  });
};

const deleteItemById = (id) => {
  return Item.destroy({
    where: { id: id },
  })
    .then((deletedRows) => {
      if (deletedRows > 0) {
        return Promise.resolve();
      } else {
        return Promise.reject(new Error("Item not deleted."));
      }
    })
    .catch((error) => {
      return Promise.reject(
        new Error("Unable to delete item: " + error.message)
      );
    });
}

module.exports = {
  initialize,
  getAllItems,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  getPublishedItems,
  addItem,
  getPublishedItemsByCategory,
  getCategories,
  addCategory,
  deleteItemById,
  deleteCategoryById,
};
