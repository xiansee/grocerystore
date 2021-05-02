import * as thisModule from "./grocery.js";
import { findDocuments, appendDocument, createDocument, saveDocument } from "../database-helpers/crud.js";
import { createError } from "./response.js";

/**
 *  Validates if query is a non-empty object with specific keys
 *  @param  {object} query Query object.
 *  @return {object}       Returns query object with a modified value of "limit" property.
 */
function validateQuery(query) {
  if (Object.keys(query).length === 0) return {};
  const { category, name, _id } = query;

  if (category || name || _id) {
    const processedQuery = thisModule.processLimit(query);
    return processedQuery;
  }

  const error = Error("No category, name or _id specified in query.");
  error.name = "QueryError";
  throw error;
}

/**
 *  Converts value of "limit" property of an object to type integer or assigns a null value if not specified.
 *  @param  {object} query Query object.
 *  @return {object}       Returns query object with a modified value of "limit" property.
 */
function processLimit(query) {
  const limit = query.limit;
  if (limit) query.limit = parseInt(limit);
  else query.limit = null;
  return query;
}

/**
 *  Filter an object for specific keys.
 *  @param  {object} query Query object.
 *  @return {object}       Returns query object with only the "category", "name" and "_id" keys.
 */
function processQuery(query) {
  const { category, name, _id } = query;
  const newQuery = {};
  if (category) newQuery.category = category;
  if (name) newQuery.name = name;
  if (_id) newQuery._id = _id;
  return newQuery;
}

/**
 *  Query database for documents.
 *  @param  {object} Model Model to be searched.
 *  @param  {object} query Query object with the required "limit" key.
 *  @return {array}        Array of found documents, if any.
 */
function executeQuery(Model, query) {
  const { limit } = query;
  const processedQuery = thisModule.processQuery(query);
  return findDocuments(Model, processedQuery, limit);
}

/**
 *  Get the document _id of a category.
 *  @param  {object} Category     Model to be searched.
 *  @param  {string} categoryName Name of category.
 *  @return {string}              Document _id of categoryName.
 */
async function getCategoryId(Category, categoryName) {
  const [categoryDocument] = await findDocuments(Category, { name: categoryName }, 1);
  if (!categoryDocument) throw createError("InputError", `'${categoryName}' is not a valid category.`);

  return categoryDocument._id;
}

//impure functions

/**
 *  Append grocery id to a category document
 *  @param  {object} newGrocery Grocery document to be added.
 *  @param  {string} categoryId Document _id of category to be appended.
 *  @param  {object} Category   Model to be searched.
 *  @return {object}            Category document after grocery has been appended.
 */
async function addGroceryToCategory(newGrocery, categoryId, Category) {
  const newGroceryId = newGrocery._id;
  return await appendDocument(Category, { _id: categoryId }, { groceryIds: { _id: newGroceryId } });
}

/**
 *  Creates a grocery document and establishes relationship with the corresponding category document.
 *  @param  {object} Grocery  Grocery model.
 *  @param  {object} newItem  Object used to create a document.
 *  @param  {object} Category Category model.
 *  @return {object}          Saved grocery document.
 */
async function createGrocery(Grocery, newItem, Category) {
  if (Object.keys(newItem) === 0) throw createError("InputError", "No valid fields specified for new grocery item.");
  const newGrocery = createDocument(Grocery, newItem);

  const categoryId = await thisModule.getCategoryId(Category, newGrocery.category);
  newGrocery.categoryId = categoryId;

  await saveDocument(newGrocery);
  await thisModule.addGroceryToCategory(newGrocery, categoryId, Category);
  return newGrocery;
}

/**
 *  Update grocery document.
 *  @param  {object} Grocery   Grocery model.
 *  @param  {string} groceryId Document _id of the grocery to be updated.
 *  @param  {object} update    Object to be used to execute update.
 *  @return {object}           Updated grocery document.
 */
async function updateGrocery(Grocery, groceryId, update) {
  const [groceryItem] = await findDocuments(Grocery, { _id: groceryId }, 1);
  if (!groceryItem) throw createError("NotFound", `No grocery item found.`);

  Object.keys(update).map((field) => {
    groceryItem[field] = update[field];
  });

  await saveDocument(groceryItem);
  return groceryItem;
}

export { validateQuery, processLimit, processQuery, executeQuery, getCategoryId, addGroceryToCategory, createGrocery, updateGrocery };
