const request = require("supertest");
const app = require("../service");
const { createAdminUser } = require("../helpers/testHelpers");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
});

test("login", async () => {
  const loginRes = await request(app).put("/api/auth").send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );

  const { password, ...user } = { ...testUser, roles: [{ role: "diner" }] };
  expect(loginRes.body.user).toMatchObject(user);
  expect(password).toBe("a");
});

test("logout", async () => {
  const logoutRes = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${testUserAuthToken}`);

  expect(logoutRes.status).toBe(200);
  expect(logoutRes.body.message).toBe("logout successful");
  expect(logoutRes.headers.authorization).toBeUndefined();
});

test("update user", async () => {
  if (process.env.VSCODE_INSPECTOR_OPTIONS) {
    jest.setTimeout(60 * 1000 * 5); // 5 minutes
  }
  const user = await createAdminUser();
  const loginRes = await request(app).put("/api/auth").send(user);

  testUserAuthToken = loginRes.body.token;

  const updatedUser = {
    ...loginRes.body.user,
    email: Math.random().toString(36).substring(2, 12) + "@test.com",
    password: user.password,
  };

  const updateUserRes = await request(app)
    .put(`/api/auth/${updatedUser.id}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(updatedUser);
  expect(updateUserRes.status).toBe(200);
  expect(updateUserRes.body.email).toBe(updatedUser.email);
});

// afterAll(async () => {
//   // clean up (drop tables, etc.)
//   DB.clearTables();
// });

// test("create admin", async () => {
//   const admin = await createAdminUser();
//   const loginRes = await request(app).put("/api/auth").send(admin);
//   testUserAuthToken = loginRes.body.token;

//   let user = {
//     name: "admin",
//     email: "a@jwt.com",
//     password: "toomanysecrets",
//     roles: [{ role: Role.Admin }],
//   };

//   await DB.addUser(user);
// });
