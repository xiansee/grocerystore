import mongoose from "mongoose";
import { readdir } from "fs/promises";
import path from "path";
import mongooseConfig from "../../config/database.config.js";
import * as crudHelpers from "./crud.js";
import * as thisModule from "./initiation.js";
import { rejects } from "assert";

/**
 *  Connect to mongodb using mongoose.
 *  @param  {object} config Configuration object.
 *  @return {object}        Mongoose connection.
 */
function connectMongodb(config) {
  const { mongoose, baseUri, databaseName } = config;
  const uri = `${baseUri}/${databaseName}`;

  mongoose.set("useUnifiedTopology", true);
  mongoose.set("useNewUrlParser", true);
  mongoose.connect(uri);

  return mongoose.connection;
}

/**
 *  Create a model.
 *  @param  {object} config Configuration object contaning a mongoose instance, schema and modelName.
 *  @return {object}        Mongoose model.
 */
function createModel(config) {
  const { mongoose, schemaConfig, modelName } = config;
  const schema = new mongoose.Schema(schemaConfig, { versionKey: false });

  return mongoose.model(modelName, schema);
}

/**
 *  Get demo data from a specified file path
 *  @param  {string} relativePath File path relative to root (e.g. "/data/demo")
 *  @return {object}              Object containing demo data keyed by modelName.
 */
async function getDemoData(relativePath) {
  const __dirname = path.resolve();
  const files = await readdir(__dirname + relativePath);

  function packDemoData(files) {
    return Promise.all(
      files.map(async function (file) {
        const filePath = "../.." + relativePath + file;
        const data = await import(filePath);
        const modelName = file.split(".").shift();
        demoData[modelName] = data.default;
        return demoData;
      })
    );
  }

  const demoData = {};
  await packDemoData(files);
  return demoData;
}

/**
 *  Check if collection is empty.
 *  @param  {object} Model Model to be checked.
 *  @return {Promise}      Resolves to a boolean.
 */
async function collectionIsEmpty(Model) {
  return new Promise((resolve) => {
    Model.findOne({}, (err, foundItem) => {
      if (!err) {
        if (foundItem) {
          resolve(false);
          return;
        }
        resolve(true);
        return;
      }
      console.error(err);
      rejects(err);
      return;
    });
  });
}

//Impure functions

/**
 *  Add category _id's to grocery documents and add grocery _id's to category documents.
 *  @param {object} Model Grocery model.
 *  @param {object} Model Category model.
 */
async function linkCategoriesAndGroceries(groceryModel, categoryModel) {
  const { findDocuments, appendDocument, updateDocument } = crudHelpers;
  const allGroceries = await findDocuments(groceryModel, {}, null);
  const allCategories = await findDocuments(categoryModel, {}, null);

  allGroceries.map((grocery) => {
    if (grocery.categoryId) return;
    const [filteredCategory] = allCategories.filter((category) => category.name === grocery.category);
    const categoryId = filteredCategory._id;
    const groceryId = grocery._id;
    appendDocument(categoryModel, { _id: categoryId }, { groceryIds: groceryId });
    updateDocument(groceryModel, { _id: groceryId }, { categoryId: categoryId });
  });
}

/**
 *  Save demo data into Models.
 *  @param {object} databaseModels Object containing mongoose Models keyed by modelName.
 *  @param {string} relativePath   File path relative to root (e.g. "/data/demo")
 */
async function loadDemoData(databaseModels, relativePath) {
  const demoData = await thisModule.getDemoData(relativePath);

  return Promise.all(
    Object.keys(demoData).map((key) => {
      return new Promise((firstResolve) => {
        thisModule.collectionIsEmpty(databaseModels[key]).then((isEmpty) => {
          if (isEmpty) {
            return firstResolve(
              Promise.all(
                demoData[key].map((data) => {
                  return new Promise((secondResolve) => {
                    const newDocument = crudHelpers.createDocument(databaseModels[key], data);
                    newDocument.save().then(() => secondResolve(newDocument));
                  });
                })
              )
            );
          } else {
            firstResolve();
          }
        });
      });
    })
  );
}

/**
 *  Initialize mongodb via mongoose.
 */
async function initDatabase() {
  const { baseUri, databaseName, addDemoData, models } = mongooseConfig;

  thisModule.connectMongodb({
    mongoose: mongoose,
    baseUri: baseUri,
    databaseName: databaseName,
  });

  const databaseModels = {};
  models.map((model) => {
    databaseModels[model.modelName] = thisModule.createModel({
      mongoose: mongoose,
      schemaConfig: model.schemaConfig,
      modelName: model.modelName,
    });
  });

  if (addDemoData) {
    await thisModule.loadDemoData(databaseModels, "/data/demo/");
    await thisModule.linkCategoriesAndGroceries(databaseModels["grocery"], databaseModels["category"]);
  }

  return databaseModels;
}

export { connectMongodb, createModel, getDemoData, collectionIsEmpty, loadDemoData, initDatabase, linkCategoriesAndGroceries };
