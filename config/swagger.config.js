const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Grocery Store",
      description: "Online shopping API for a mock grocery store.",
      version: "1.0.0",
    },
  },
  apis: ["./routes/api-documentation/*.yaml"],
};

export default swaggerOptions;
