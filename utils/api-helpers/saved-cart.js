import { findDocuments } from "../database-helpers/crud.js";
import { createError } from "./response.js";

/**
 *  Validate an API request body.
 *  @param {object} request API Request body.
 *  @throw                  Throws an error if request body has an invalid format.
 */
function validateRequest(request) {
  const error = createError("InputError", "Required format for request body: { 'cart': [{'_id': '123a4bc'}, ...] }");

  const { cart } = request;
  if (!cart) throw error;
  if (!Array.isArray(cart)) throw error;

  cart.map((item) => {
    if (typeof item !== "object") throw error;

    const { _id } = item;
    if (!_id) throw error;
  });

  return;
}

/**
 *  Query for grocery items.
 *  @param  {object} Grocery Model containing grocery documents.
 *  @param  {array}  cart    List of objects with grocery "_id" property.
 *  @return {array}          List of grocery documents.
 *  @throw                   Throws an error if a grocery cannot be found.
 */
function getGroceryItems(Grocery, cart) {
  return Promise.all(
    cart.map((cartItem) => {
      return new Promise(async (resolve, reject) => {
        const [groceryItem] = await findDocuments(Grocery, { _id: cartItem._id }, 1);
        if (groceryItem) resolve(groceryItem);
        else {
          const error = createError("NotFound", `Invalid grocery _id: '${cartItem._id}'.`);
          reject(error);
        }
      });
    })
  );
}

export { validateRequest, getGroceryItems };
