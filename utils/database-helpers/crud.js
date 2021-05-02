import * as thisModule from "./crud.js";
import { createError } from "../api-helpers/response.js";

/**
 *  Create a new document
 *  @param  {object} Model    Model schema to be used.
 *  @param  {object} document Document details.
 *  @return {object}          A document.
 */
function createDocument(Model, document) {
  return new Model(document);
}

/**
 *  Save a document.
 *  @param  {object}  document Document to be saved.
 *  @return {Promise}          Resolves to saved document.
 */
async function saveDocument(document) {
  try {
    return await document.save();
  } catch (err) {
    throw thisModule.processValidationError(err);
  }
}

/**
 *  Find documents
 *  @param  {object}  Model Model to be searched.
 *  @param  {object}  query Search query
 *  @param  {object}  limit Maximim number of documents to return.
 *  @return {Promise}       Resolves to an array of documents, if found.
 */
function findDocuments(Model, query = {}, limit = null) {
  return new Promise((resolve) => {
    Model.find(query, (err, documents) => {
      if (!err && documents) resolve(documents);
      else resolve([]);
    }).limit(limit);
  });
}

/**
 *  Get user's stored password from database.
 *  @param  {object}  User  Model to be searched.
 *  @param  {string}  email User's email
 *  @return {Promise}       Resolves to user's password string.
 */
function getUserPassword(User, email) {
  return new Promise((resolve) => {
    User.findOne({ email: email })
      .select("password")
      .exec((err, user) => {
        if (!err && user) resolve(user.password);
        else resolve(null);
      });
  });
}

/**
 *  Process and validates a query.
 *  @param  {object} Model Model to be searched.
 *  @param  {object} query Search query
 *  @return {object}       Query filtered to contain only fields defined in the model schema.
 */
function processQuery(Model, query) {
  const schemaFields = Object.keys(Model.schema.paths);
  const filteredQuery = {};
  Object.keys(query).map((field) => {
    if (field === "_id") throw createError("IncorrectField", `Update to _id field is not allowed.`);
    if (!schemaFields.includes(field)) throw createError("IncorrectField", `Field ${field} is not defined in data schema.`);
    filteredQuery[field] = query[field];
    return;
  });
  return filteredQuery;
}

/**
 *  Process a validation error thrown by Mongoose.
 *  @param  {object} err Error object.
 *  @return {object}     New error object if validation error with customized error messages.
 */
function processValidationError(err) {
  const errorKeyList = Object.keys(err.errors);
  const firstKey = errorKeyList[0];
  const errorName = err.errors[firstKey].name;
  const fields = errorKeyList.join(", ");

  if (errorName === "ValidationError") return createError(errorName, `The following fields are required: ${fields}`);
  if (errorName === "ValidatorError") return createError(errorName, `The following fields are required: ${fields}`);
  if (errorName === "CastError") return createError(errorName, `Incorrect type for the following fields: ${fields}`);

  return err;
}

//impure functions

/**
 *  Update a document
 *  @param  {object} Model  Model to be used.
 *  @param  {object} query  Search query.
 *  @param  {object} update Updates to be made.
 *  @return {object}        Updated document.
 */
async function updateDocument(Model, query, update) {
  const [document] = await thisModule.findDocuments(Model, query, 1);
  if (!document) return;
  Object.keys(update).map((key) => {
    document[key] = update[key];
  });
  await thisModule.saveDocument(document);
  return document;
}

/**
 *  Append a document
 *  @param  {object} Model  Model to be used.
 *  @param  {object} query  Search query.
 *  @param  {object} update Appends to be made.
 *  @return {object}        Appended document.
 */
async function appendDocument(model, query, append) {
  const [document] = await thisModule.findDocuments(model, query, 1);
  Object.keys(append).map((key) => {
    document[key].push(append[key]);
  });
  thisModule.saveDocument(document);
  return document;
}

/**
 *  Delete a document
 *  @param  {object}  Model  Model to be used.
 *  @param  {object}  query  Search query.
 *  @return {Promise}        Resolves if deletion successful. Else rejects an error.
 */
function deleteDocument(model, query) {
  return new Promise((resolve, reject) => {
    model.deleteOne(query, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export { createDocument, saveDocument, findDocuments, getUserPassword, processQuery, processValidationError, updateDocument, appendDocument, deleteDocument };
