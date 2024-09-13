const itemData = require("./store-service");
const path = require("path");
const fs = require("fs");
const express = require("express");
const exphbs = require("express-handlebars");
const handlebars = require("handlebars");
const stripJs = require("strip-js");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

itemData.initialize()
  .then(message => {
    console.log(message);
  
  })
  .catch(error => {
    console.error(error);
  });

const hbs = exphbs.create({
  extname: ".hbs",
});

app.engine(
  "hbs",
  exphbs.engine({
    extname: ".hbs",
  })
);
app.set("view engine", "hbs");

const navLink = function (url, options) {
  return (
    '<li class="nav-item"><a ' +
    (url == app.locals.activeRoute
      ? ' class="nav-link active" '
      : ' class="nav-link" ') +
    ' href="' +
    url +
    '">' +
    options.fn(this) +
    "</a></li>"
  );
};

const equal = function (lvalue, rvalue, options) {
  if (arguments.length < 3)
    throw new Error("Handlebars Helper equal needs 2 parameters");
  if (lvalue != rvalue) {
    return options.inverse(this);
  } else {
    return options.fn(this);
  }
};

const safeHTML = function (context) {
  return stripJs(context);
};

hbs.handlebars.registerHelper("navLink", navLink);
hbs.handlebars.registerHelper("equal", equal);
hbs.handlebars.registerHelper("safeHTML", function (context) {
  return new handlebars.SafeString(stripJs(context));
});

/******** Middleware ********/

app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.use(express.static(__dirname + "/public"));

app.set("views", __dirname + "/views");

/******** Routes ********/

app.get("/", (req, res) => {
  res.redirect("/about");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/shop", async (req, res) => {
  let viewData = {};

  try {
    let items = [];

    if (req.query.category) {
      items = await itemData.getPublishedItemsByCategory(req.query.category);
    } else {
      items = await itemData.getPublishedItems();
    }

    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

    let item = items[0];

    viewData.items = items;
    viewData.item = item;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    let categories = await itemData.getCategories();

    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  res.render("shop", { data: viewData });
});

app.get('/items', async (req, res) => {
  try {
    const items = await itemData.getAllItems();
    res.render('items', { items: items });
  } catch (error) {
    console.error("Error fetching items from database:", error);
    res.render('items', { message: "no results" });
  }
});

app.get('/categories', async (req, res) => {
  try {
    const categories = await itemData.getCategories();
    res.render('categories', { categories: categories || [] });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).send('Error fetching categories');
  }
});

app.get("/item/:id", (req, res) => {
  const itemId = req.params.id;

  itemData
    .getItemById(itemId)
    .then((item) => {
      res.render("shop", {
        item: item,
        items: [],
        categories: [],
        message: null,
        categoriesMessage: null,
      });
    })
    .catch((error) => {
      res.render("shop", {
        item: null,
        items: [],
        categories: [],
        message: error.message || "Item not found",
        categoriesMessage: null,
      });
    });
});

app.get("/shop/:id", async (req, res) => {
  let viewData = {};

  try {
    let items = [];

    if (req.query.category) {
      items = await itemData.getPublishedItemsByCategory(req.query.category);
    } else {
      items = await itemData.getPublishedItems();
    }

    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

    viewData.items = items;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    viewData.item = await itemData.getItemById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    let categories = await itemData.getCategories();

    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  res.render("shop", { data: viewData });
});

app.get("/categories/delete/:id", (req, res) => {
  const categoryId = req.params.id;

  itemData.deleteCategoryById(categoryId)
    .then(() => {
      res.redirect("/categories");
    })
    .catch(() => {
      res.status(500).send("Unable to Remove Category / Category not found");
    });
});

app.get("/items/delete/:id", (req, res) => {
  const itemId = req.params.id;

  itemData.deleteItemById(itemId)
    .then(() => {
      res.redirect("/items");
    })
    .catch(() => {
      res.status(500).send("Unable to Remove Item / Item not found");
    });
});

app.post("/items/add", (req, res) => {
  const newItem = req.body;

  console.log('Received item data:', newItem);

  itemData.addItem(newItem)
    .then(() => {
      res.redirect("/items");
    })
    .catch((error) => {
      console.error("Error adding item:", error);
      res.render("addItem", { message: "Unable to add item" });
    });
});


app.post("/categories/add", (req, res) => {
  const categoryData = req.body;

  for (const key in categoryData) {
    if (categoryData[key] === "") {
      categoryData[key] = null;
    }
  }

  itemData.addCategory(categoryData)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((error) => {
      console.error("Error adding category:", error);
      res.render("addCategory", { message: "Unable to add category" });
    });
});

app.get("/items/add", (req, res) => {
  itemData.getCategories()
    .then((data) => {
      res.render("addItem", { categories: data });
    })
    .catch((error) => {
      console.error("Error fetching categories:", error);
      res.render("addItem", { categories: [] });
    });
});

app.get("/categories/add", (req, res) => {
  res.render("addCategory", { title: "Add Category" });
});

app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

app.listen(HTTP_PORT, () => {
  console.log(`Express http server listening on port ${HTTP_PORT}`);
});
