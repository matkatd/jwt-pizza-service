const request = require("supertest");
const app = require("../service");
const { createAdminUser } = require("../helpers/testHelpers");
// const { DB } = require("../database/database");

let testUserAuthToken = "";
let franchiseName = "";
let addFranchiseRes = {};
let testUser = {};

beforeEach(async () => {
  const user = await createAdminUser();
  const loginRes = await request(app).put("/api/auth").send(user);

  testUserAuthToken = loginRes.body.token;
  testUser = loginRes.body.user;
  franchiseName = "PizzaPocket" + Math.random().toString(36).substring(2, 12);

  addFranchiseRes = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send({
      name: franchiseName,
      admins: [{ email: loginRes.body.user.email }],
    });
  expect(addFranchiseRes.status).toBe(200);
});

test("add franchise", async () => {
  expect(addFranchiseRes.body).toEqual({
    name: franchiseName,
    admins: [{ name: testUser.name, email: testUser.email, id: testUser.id }],
    id: addFranchiseRes.body.id,
  });
});

test("get franchises", async () => {
  const res = await request(app).get("/api/franchise");
  expect(res.status).toBe(200);
  expect(res.body.length).toBeGreaterThan(0);
});

test("get user franchises", async () => {
  const res = await request(app)
    .get(`/api/franchise/${testUser.id}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(res.status).toBe(200);
  expect(res.body.length).toBeGreaterThan(0);

  expect(res.body).toEqual([
    {
      name: franchiseName,
      admins: [{ name: testUser.name, email: testUser.email, id: testUser.id }],
      id: addFranchiseRes.body.id,
      stores: [],
    },
  ]);
});

test("delete franchise", async () => {
  const res = await request(app)
    .delete(`/api/franchise/${addFranchiseRes.body.id}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ message: "franchise deleted" });
});

test("add store", async () => {
  const res = await request(app)
    .post(`/api/franchise/${addFranchiseRes.body.id}/store`)
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send({ franchiseId: addFranchiseRes.body.id, name: "SLC" });
  expect(res.status).toBe(200);
  expect(res.body).toEqual({
    id: res.body.id,
    franchiseId: addFranchiseRes.body.id,
    name: "SLC",
  });
});

test("delete store", async () => {
  const res = await request(app)
    .delete(`/api/franchise/${addFranchiseRes.body.id}/store/1`)
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ message: "store deleted" });
});

// afterAll(async () => {
//   // clean up (drop tables, etc.)
//   DB.clearTables();
// });
