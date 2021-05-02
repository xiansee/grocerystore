export default {
  baseUri: "mongodb://localhost:27017",
  databaseName: "groceryStoreDb",
  addDemoData: true,
  models: [
    {
      modelName: "grocery",
      schemaConfig: {
        name: { type: String, required: true },
        brand: { type: String, required: true },
        category: { type: String, required: true },
        categoryId: { type: String },
        price: {
          type: { value: { type: Number, required: true }, currency: { type: String, required: true } },
          required: true,
        },
        volume: {
          type: { value: Number, unit: String },
        },
        mass: {
          type: { value: Number, unit: String },
        },
        quantity: { type: Number },
        stock: { type: Number, required: true },
        status: { type: String, required: true },
      },
    },
    {
      modelName: "category",
      schemaConfig: {
        name: { type: String, required: true },
        status: { type: String, required: true },
        groceryIds: { type: [{ _id: String }] }, //array of Grocery _id
      },
    },
    {
      modelName: "order",
      schemaConfig: {
        customerId: { type: String, required: true },
        orderDate: { type: Date, required: true },
        groceryIds: { type: [{ _id: String }], required: true }, //array of Grocery _id
        totalCost: { value: { type: Number, required: true }, currency: { type: String, required: true } },
        paymentReceived: { type: Boolean, required: true },
        paymentDate: { type: Date },
        status: { type: String, required: true },
      },
    },
    {
      modelName: "user",
      schemaConfig: {
        firstName: { type: String, required: true },
        lastName: { type: String },
        email: { type: String, required: true },
        password: { type: String, select: false, required: true },
        contactNumber: { type: String },
        postalCode: { type: String },
        dateRegistered: { type: Date, required: true },
        orders: { type: [{ _id: String }] }, //array of Orders _id
        type: { type: String, required: true },
        status: { type: String, required: true },
      },
    },
  ],
};
