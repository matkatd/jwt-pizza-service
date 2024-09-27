const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database");
const { createAdminUser } = require("../helpers/testHelpers");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;

beforeAll(async () => {
  // setup (insert data, etc.)
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
  testUser.id = registerRes.body.user.id;

  const franchise = await DB.createFranchise({
    name: "PizzaPocket" + Math.random().toString(36).substring(2, 12),
    admins: [{ email: testUser.email }],
  });

  const store = await DB.createStore(1, { id: 1, franchiseId: 1, name: "SLC" });

  const item = await DB.addMenuItem({
    title: "pizza",
    price: 10,
    description: "yum",
    image: "lol",
    menuId: 1,
  });
  await DB.addDinerOrder(registerRes.body.user, {
    dinerId: registerRes.body.user.id,
    items: [item, item],
    storeId: store.id,
    franchiseId: franchise.id,
  });
});

test("get franchises", async () => {
  const res = await request(app).get("/api/franchise");
  expect(res.status).toBe(200);
  expect(res.body.length).toBeGreaterThan(0);
});

test("get menu items", async () => {
  const res = await request(app).get("/api/order/menu");
  expect(res.status).toBe(200);
  expect(res.body.length).toBeGreaterThan(0);
});

test("get orders", async () => {
  const res = await request(app)
    .get("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(res.status).toBe(200);

  expect(res.body.orders.length).toBeGreaterThan(0);
});

test("add menu item", async () => {
  const admin = await createAdminUser();
  const loginRes = await request(app).put("/api/auth").send(admin);

  if (process.env.VSCODE_INSPECTOR_OPTIONS) {
    jest.setTimeout(60 * 1000 * 5); // 5 minutes
  }

  const res = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${loginRes.body.token}`)
    .send({
      title: "Margherita",
      price: 10,
      description: "the stuff dreams are made of",
      image: "pizza2.png",
      menuId: 1,
    });

  expect(res.status).toBe(200);
  expect(res.body.length).toBeGreaterThan(0);
});

test("create order", async () => {
  if (process.env.VSCODE_INSPECTOR_OPTIONS) {
    jest.setTimeout(60 * 1000 * 5); // 5 minutes
  }
  const res = await request(app)
    .post("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send({
      user: testUser,
      dinerId: testUser.id,
      franchiseId: 1,
      storeId: 1,
      items: [{ menuId: 1, description: "pizza", price: 10 }],
    });
  expect(res.status).toBe(200);
  expect(res.body.order).toMatchObject({
    franchiseId: 1,
    storeId: 1,
    items: [{ menuId: 1, description: "pizza", price: 10 }],
  });
});

// afterAll(async () => {
//   // clean up (drop tables, etc.)
//   DB.clearTables();
// });
