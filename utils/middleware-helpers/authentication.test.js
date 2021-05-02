import * as authenticationHelpers from "./authentication.js";
import bcrypt from "bcrypt";
import regeneratorRuntime from "regenerator-runtime";

const { getHashedPassword, verifyPassword, processUserData } = authenticationHelpers;

test("generate a hashed password using bcrypt", async () => {
  const genSalt = jest.spyOn(bcrypt, "genSalt");
  const hash = jest.spyOn(bcrypt, "hash");
  const dummyError = new Error("Dummy Error");

  genSalt.mockImplementation((saltRounds, cb) => {
    cb(null, "salt");
  });
  hash.mockImplementation((password, salt, cb) => {
    cb(null, "hash");
  });

  const dummyPassword = "passwordString";
  expect(await getHashedPassword(dummyPassword)).toEqual("hash");
  expect(genSalt).toHaveBeenCalled();
  expect(hash).toHaveBeenCalledWith(dummyPassword, "salt", expect.any(Function));

  //Test genSalt error
  genSalt.mockImplementation((saltRounds, cb) => {
    cb(dummyError, "salt");
  });
  expect(async () => await getHashedPassword(dummyPassword)).rejects.toEqual(dummyError);

  //Test hash error
  genSalt.mockImplementation((saltRounds, cb) => {
    cb(null, "salt");
  });
  hash.mockImplementation((password, salt, cb) => {
    cb(dummyError, "hash");
  });
  expect(async () => await getHashedPassword(dummyPassword)).rejects.toEqual(dummyError);
});

test("verify if passwords match using bcrypt", async () => {
  const compare = jest.spyOn(bcrypt, "compare");
  compare.mockImplementation((inputPassword, storedPassword, cb) => {
    cb(null, true);
  });

  const dummyPassword = "passwordString";
  const dummyHash = "passwordHash";
  const dummyError = new Error("Dummy Error");
  expect(await verifyPassword(dummyPassword, dummyHash)).toEqual(true);
  expect(compare).toHaveBeenCalledWith(dummyPassword, dummyHash, expect.any(Function));

  //Test compare error
  compare.mockImplementation((inputPassword, storedPassword, cb) => {
    cb(dummyError, true);
  });
  expect(() => verifyPassword(dummyPassword, dummyHash)).rejects.toEqual(dummyError);
});
