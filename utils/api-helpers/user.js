import { findDocuments, createDocument, saveDocument, processQuery, updateDocument, deleteDocument } from "../database-helpers/crud.js";
import { getHashedPassword } from "../middleware-helpers/authentication.js";
import { createError } from "./response.js";

/**
 *  Validate an API request body for login operation.
 *  @param {object} requestBody API request body.
 *  @throw                       Throws an error if request body has an invalid format.
 */
function validateLoginRequest(requestBody) {
  const { email, password } = requestBody;

  if (typeof email === "string" && typeof password === "string") return;
  throw createError("InputError", "Required format for request body: { 'email': 'name@email.com', 'password': 'passwordString' }");
}

/**
 *  Validate an API request body for registration.
 *  @param {object} requestBody API request body.
 *  @throw                       Throws an error if request body has an invalid format.
 */
function validateRegistrationRequest(requestBody) {
  const { email, password, firstName } = requestBody;

  if (typeof email === "string" && typeof password === "string" && typeof firstName === "string") return;
  throw createError("InputError", "Required format for request body: { 'firstName': 'Jane', 'email': 'jane@email.com', 'password': 'passwordString' }");
}

/**
 *  Validate a userId.
 *  @param {object} User   Model to be searched.
 *  @param {string} userId Document _id of the user.
 *  @throw                 Throws an error if user not found.
 *  @return {object}       Returns user document if user is found.
 */
async function validateUserId(User, userId) {
  if (typeof userId !== "string") throw createError("InputError", "Type string required for user _id.");
  const [user] = await findDocuments(User, { _id: userId }, 1);
  if (user) return user;
  throw createError("NotFound", `User with _id ${userId} not found.`);
}

/**
 *  Validate update object for a user document.
 *  @param  {object} User        Model to be searched.
 *  @param  {object} updateQuery Object to be used for update.
 *  @param  {string} authority   User type: Administrator or not.
 *  @return {object}             Filtered update object.
 */
async function validateUpdateFields(User, updateQuery, authority) {
  const filteredQuery = processQuery(User, updateQuery);
  if (filteredQuery["type"] && authority !== "Administrator") throw createError("Forbidden", "User type can only be modified by an administrator.");
  if (filteredQuery["password"]) filteredQuery["password"] = await getHashedPassword(filteredQuery["password"]);
  return filteredQuery;
}

/**
 *  Check if user email exists in database.
 *  @param  {object} User  Model to be searched.
 *  @param  {string} email User email to be checked.
 *  @return {boolean}      Indication whether user exists or not.
 */
async function userExists(User, email) {
  const [user] = await findDocuments(User, { email: email }, 1);
  if (user) return true;
  return false;
}

/**
 *  Check if user is of type Administrator.
 *  @param  {object}  user User document to be checked.
 *  @return {boolean}      Indication whether user is Administrator or not.
 */
function userIsAdmin(user) {
  if (user.type === "Administrator") return true;
  return false;
}

//impure functions

/**
 *  Register a user
 *  @param {object}  User         Model to be searched.
 *  @param {object}  registration User details.
 *  @return {object}              Newly created user document.
 */
async function registerUser(User, registration) {
  registration.password = await getHashedPassword(registration.password);
  registration.type = "Standard";
  registration.status = "Active";
  registration.dateRegistered = new Date();
  const newUser = createDocument(User, registration);
  return await saveDocument(newUser);
}

/**
 *  Update a user document
 *  @param  {object} User   Model to be searched.
 *  @param  {string} userId Document _id of user to be updated.
 *  @param  {object} update Fields to update.
 *  @return {object}        Updated user document.
 */
async function updateUser(User, userId, update) {
  await updateDocument(User, { _id: userId }, update);
  const [user] = await findDocuments(User, { _id: userId }, 1);
  return user;
}

/**
 *  Delete a user document
 *  @param {object} User   Model to be searched.
 *  @param {string} userId Document _id of user to be deleted.
 */
async function deleteUser(User, userId) {
  await deleteDocument(User, { _id: userId });
  return;
}

export {
  validateLoginRequest,
  validateRegistrationRequest,
  validateUserId,
  validateUpdateFields,
  userExists,
  userIsAdmin,
  registerUser,
  updateUser,
  deleteUser,
};
