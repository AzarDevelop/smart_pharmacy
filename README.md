# Smart Pharmacy Availability Check System

MCA mini project built on the MERN stack — **MongoDB, Express.js, React.js, Node.js** with **JWT** authentication and role-based access for three roles: **User (customer)**, **Pharmacy**, and **Admin**.

A customer searches for a medicine and immediately sees which nearby pharmacies have it, at what price, with what stock, and can reserve it for pickup. Pharmacies maintain their own inventory and handle reservations. The admin manages the whole system.

---

## 1. Project architecture

```
┌──────────────────────────┐        Axios (HTTP + JWT)        ┌──────────────────────────┐
│   React SPA (Vite)       │  ───────────────────────────►    │  Express REST API        │
│   Port 5173              │                                  │  Port 5000               │
│                          │  ◄───────────────────────────    │                          │
│  · AuthContext (JWT)     │        JSON responses            │  · Routes                │
│  · ProtectedRoute        │                                  │  · Auth middleware (JWT) │
│  · Pages per role        │                                  │  · Role authorisation    │
└──────────────────────────┘                                  │  · Controllers           │
                                                              │  · Mongoose models       │
                                                              └───────────┬──────────────┘
                                                                          │ Mongoose ODM
                                                              ┌───────────▼──────────────┐
                                                              │  MongoDB                 │
                                                              │  smart_pharmacy          │
                                                              │  7 collections           │
                                                              └──────────────────────────┘
```

**Request flow (example: reserving a medicine)**

1. React calls `POST /api/reservations` with the JWT in the `Authorization` header.
2. `protect` middleware verifies the token and loads the user.
3. `authorize('user')` confirms the role is a customer.
4. The controller checks stock, creates the reservation, decrements the inventory, and writes two notifications (customer + pharmacy).
5. JSON goes back and React re-renders with the pickup code.

**Three-layer backend:** routes → controllers → models. No business logic sits in the routes, and no database calls sit in the React app.

---

## 2. Folder structure

```
smart-pharmacy/
├── backend/
│   ├── config/db.js                 MongoDB connection
│   ├── controllers/                 business logic (8 files)
│   │   ├── authController.js        register, login, profile, password
│   │   ├── medicineController.js    search (partial + fuzzy), availability
│   │   ├── pharmacyController.js    listing, nearby (geo), profile
│   │   ├── inventoryController.js   stock, price, low-stock, stats
│   │   ├── reservationController.js reserve, status flow, cancel
│   │   ├── notificationController.js
│   │   ├── categoryController.js
│   │   └── adminController.js       stats, activity, user management
│   ├── middleware/
│   │   ├── auth.js                  protect (JWT) + authorize (roles)
│   │   └── error.js                 404 + central error handler
│   ├── models/                      Mongoose schemas (7 collections)
│   │   ├── User.js  Pharmacy.js  Category.js  Medicine.js
│   │   └── Inventory.js  Reservation.js  Notification.js
│   ├── routes/                      URL → controller mapping (8 files)
│   ├── utils/
│   │   ├── search.js                escapeRegex + Levenshtein fuzzy match
│   │   ├── generateToken.js         JWT signing
│   │   ├── asyncHandler.js          async try/catch wrapper
│   │   └── notify.js                notification helper
│   ├── seed/seed.js                 sample data loader
│   ├── .env                         configuration
│   └── server.js                    entry point
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── api/axios.js             axios instance + JWT interceptor
        ├── context/AuthContext.jsx  login state shared across the app
        ├── components/              Navbar, ProtectedRoute, StockPill, Loader, EmptyState
        ├── pages/
        │   ├── public/              Home, Login, Register, SearchMedicines,
        │   │                        MedicineDetails, NearbyPharmacies, NotFound
        │   ├── user/                UserDashboard, Reservations, Notifications, Profile
        │   ├── pharmacy/            PharmacyDashboard, Inventory, AddMedicine,
        │   │                        EditMedicine, LowStock, PharmacyReservations, PharmacyProfile
        │   └── admin/               AdminDashboard, ManageUsers, ManagePharmacies,
        │                            ManageMedicines, ManageCategories, ManageReservations
        ├── App.jsx                  all routes
        ├── main.jsx                 entry point
        └── index.css                design system
```

---

## 3. Database schema (7 collections)

### users
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | unique, lowercase |
| password | String | bcrypt hash, `select: false` |
| phone, address, city | String | |
| role | String | `user` \| `pharmacy` \| `admin` |
| status | String | `active` \| `blocked` |

### pharmacies
| Field | Type | Notes |
|---|---|---|
| owner | ObjectId → users | unique, the login account |
| name, licenseNumber | String | licence is unique |
| phone, email, address, city, pincode | String | |
| openingHours | String | |
| location | GeoJSON Point | `[longitude, latitude]`, **2dsphere index** |
| status | String | `active` \| `blocked` |

### categories
`name` (unique), `description`

### medicines — the shared catalogue
| Field | Type | Notes |
|---|---|---|
| name, brandName, genericName | String | the three searchable fields |
| manufacturer, description | String | |
| category | ObjectId → categories | |
| dosageForm | String | Tablet, Syrup, Injection… |
| strength | String | 500mg, 100ml… |
| prescriptionRequired | Boolean | |

Indexes: text index on name/brand/generic, unique compound index on `{name, strength}`.

### inventory — one row per (pharmacy, medicine)
| Field | Type | Notes |
|---|---|---|
| pharmacy | ObjectId → pharmacies | |
| medicine | ObjectId → medicines | |
| price | Number | this shop's price |
| stock | Number | live quantity |
| lowStockLimit | Number | alert threshold |
| batchNumber, expiryDate | String / Date | |

Unique compound index on `{pharmacy, medicine}`; virtual `stockStatus` returns in-stock / low-stock / out-of-stock.

### reservations
`user`, `pharmacy`, `medicine`, `inventory` (all refs), `quantity`, `unitPrice`, `totalPrice`, `status` (`pending → confirmed → ready → completed`, or `cancelled` / `rejected`), `code` (auto pickup code like `RSV-8F3A21`), `pickupDate`, `note`.

### notifications
`user` (ref), `title`, `message`, `type` (`reservation` \| `stock` \| `system`), `isRead`, `link`.

**Relationships**

```
User ──1:1── Pharmacy ──1:N── Inventory ──N:1── Medicine ──N:1── Category
  │                               │
  └────────── 1:N ── Reservation ─┘
  └────────── 1:N ── Notification
```

---

## 4. API endpoints (42 total)

Base URL: `http://localhost:5000/api`. Protected routes need `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a customer or pharmacy |
| POST | `/auth/login` | Public | Login (all three roles) |
| GET | `/auth/me` | Private | Current account details |
| PUT | `/auth/profile` | Private | Update own profile |
| PUT | `/auth/password` | Private | Change password |

### Medicines
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/medicines?search=&category=&page=&limit=` | Public | Search with availability summary |
| GET | `/medicines/:id?lat=&lng=` | Public | Details + pharmacy-wise stock and distance |
| POST | `/medicines` | Pharmacy/Admin | Add to catalogue |
| PUT | `/medicines/:id` | Admin | Update |
| DELETE | `/medicines/:id` | Admin | Delete (also clears stock rows) |

### Pharmacies
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/pharmacies?search=&city=&all=` | Public | List pharmacies |
| GET | `/pharmacies/nearby?lat=&lng=&distance=` | Public | Geo search, nearest first |
| GET | `/pharmacies/me` | Pharmacy | Own shop profile |
| PUT | `/pharmacies/me` | Pharmacy | Update own shop profile |
| GET | `/pharmacies/:id` | Public | Shop page with stock |
| PUT | `/pharmacies/:id/status` | Admin | Block / unblock |

### Inventory (pharmacy only)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/inventory?search=` | Own inventory |
| POST | `/inventory` | Add a medicine (catalogue item or new) |
| GET | `/inventory/low-stock` | Items at or below the alert limit |
| GET | `/inventory/stats` | Dashboard counters |
| GET | `/inventory/:id` | One row |
| PUT | `/inventory/:id` | Update price / stock / limit / batch |
| DELETE | `/inventory/:id` | Remove from inventory |

### Reservations
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/reservations` | User | Reserve (holds stock) |
| GET | `/reservations/my` | User | Own reservations |
| PUT | `/reservations/:id/cancel` | User | Cancel (returns stock) |
| GET | `/reservations/pharmacy` | Pharmacy | Reservations received |
| PUT | `/reservations/:id/status` | Pharmacy | confirmed / ready / completed / rejected |
| GET | `/reservations` | Admin | All reservations |

### Notifications / Categories / Admin
| Method | Endpoint | Access |
|---|---|---|
| GET `/notifications`, PUT `/notifications/:id/read`, PUT `/notifications/read-all`, DELETE `/notifications/:id` | | Private |
| GET `/categories` | | Public |
| POST `/categories`, PUT `/categories/:id`, DELETE `/categories/:id` | | Admin |
| GET `/admin/stats`, GET `/admin/activities`, GET `/admin/users`, PUT `/admin/users/:id/status`, DELETE `/admin/users/:id` | | Admin |

---

## 5. Frontend page structure

| Route | Page | Access |
|---|---|---|
| `/` | Home with search | Public |
| `/login`, `/register` | Auth | Public |
| `/search` | Search medicines | Public |
| `/medicine/:id` | Medicine details + pharmacy-wise availability | Public |
| `/pharmacies` | Nearby pharmacies | Public |
| `/user/dashboard` | Customer dashboard | User |
| `/user/reservations` | Reservations + cancel | User |
| `/user/notifications` | Notifications | User |
| `/user/profile` | Profile + password | User |
| `/pharmacy/dashboard` | Stats, restock list, recent reservations | Pharmacy |
| `/pharmacy/inventory` | Inventory table with quick stock +/− | Pharmacy |
| `/pharmacy/inventory/add` | Add medicine | Pharmacy |
| `/pharmacy/inventory/edit/:id` | Edit price/stock | Pharmacy |
| `/pharmacy/low-stock` | Low-stock alerts + restock | Pharmacy |
| `/pharmacy/reservations` | Confirm / ready / complete / reject | Pharmacy |
| `/pharmacy/profile` | Shop profile + location | Pharmacy |
| `/admin/dashboard` | System overview and activity | Admin |
| `/admin/users` | Manage accounts | Admin |
| `/admin/pharmacies` | Manage pharmacies | Admin |
| `/admin/medicines` | Manage catalogue | Admin |
| `/admin/categories` | Manage categories | Admin |
| `/admin/reservations` | All reservations | Admin |

`ProtectedRoute` blocks any route the role is not allowed to open, and the axios interceptor logs the user out automatically when the token expires.

---

## 6. Installation

### Prerequisites
- Node.js 18 or newer
- MongoDB 6+ running locally, **or** a free MongoDB Atlas cluster
- npm

### MongoDB setup

**Option A — local**
```bash
# Ubuntu/Debian
sudo systemctl start mongod
# macOS (Homebrew)
brew services start mongodb-community
# Windows: start "MongoDB Server" from Services
```
The database `smart_pharmacy` is created automatically on first write.

**Option B — MongoDB Atlas**
1. Create a free cluster at mongodb.com/atlas.
2. Add a database user and allow your IP under Network Access.
3. Copy the connection string into `MONGO_URI`:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/smart_pharmacy`

### Backend
```bash
cd backend
npm install
cp .env.example .env        # then edit if needed
npm run seed                # loads sample data
npm run dev                 # http://localhost:5000
```

### Frontend (second terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

### `.env` configuration

`backend/.env`
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart_pharmacy
JWT_SECRET=smart_pharmacy_secret_key_change_me
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
LOW_STOCK_THRESHOLD=10
```

`frontend/.env`
```
VITE_API_URL=http://localhost:5000/api
```

---

## 7. Sample login credentials

Available after running `npm run seed`.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@pharma.com` | `Admin@123` |
| Customer | `ravi@example.com` | `User@123` |
| Customer | `priya@example.com` | `User@123` |
| Customer | `arun@example.com` | `User@123` |
| Pharmacy | `apollo@pharmacy.com` | `Pharma@123` |
| Pharmacy | `medplus@pharmacy.com` | `Pharma@123` |
| Pharmacy | `guardian@pharmacy.com` | `Pharma@123` |
| Pharmacy | `srikrishna@pharmacy.com` | `Pharma@123` |

The seed data contains 7 categories, 28 medicines, 4 Chennai pharmacies with real coordinates, roughly 84 inventory rows (deliberately including low-stock and out-of-stock cases), and 4 reservations. The login page has tap-to-fill buttons for the three main accounts.

---

## 8. Testing instructions

### Quick API check
```bash
curl http://localhost:5000/api/health
curl "http://localhost:5000/api/medicines?search=paracetmol"     # deliberate typo → fuzzy match
curl "http://localhost:5000/api/pharmacies/nearby?lat=13.05&lng=80.23&distance=5"
```

Login and call a protected route:
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"apollo@pharmacy.com","password":"Pharma@123"}' | jq -r .token)

curl http://localhost:5000/api/inventory/stats -H "Authorization: Bearer $TOKEN"
```

### Manual test cases

| # | Test | Steps | Expected result |
|---|---|---|---|
| 1 | Registration | Register a new customer | Redirects to the user dashboard, welcome notification appears |
| 2 | Login validation | Log in with a wrong password | "Email or password is incorrect" |
| 3 | Partial search | Search `para` | Both Paracetamol entries appear |
| 4 | Brand search | Search `Dolo` | Paracetamol 650mg appears |
| 5 | Generic search | Search `Acetaminophen` | Both Paracetamol entries appear |
| 6 | Fuzzy search | Search `paracetmol` (typo) | Blue notice appears and the closest names are listed |
| 7 | No result | Search `zzzzz` | Empty state with guidance |
| 8 | Availability | Open a medicine | Pharmacies sorted by price, stock badges, distance after allowing location |
| 9 | Reserve | Reserve 2 units | Pickup code shown, pharmacy stock drops by 2 |
| 10 | Stock guard | Reserve more than the available stock | "Only N unit(s) left at this pharmacy" |
| 11 | Cancel | Cancel a reservation | Status becomes cancelled, stock returns |
| 12 | Pharmacy flow | Log in as pharmacy → Reservations → Confirm → Mark ready → Mark picked up | Status advances, customer gets a notification each time |
| 13 | Reject | Reject a pending reservation | Stock is returned to inventory |
| 14 | Inventory edit | Change price and stock | Customer search shows the new values immediately |
| 15 | Low stock | Set stock to 3 | Item appears on the Low stock page, alert notification is created |
| 16 | Role guard | As a customer open `/admin/dashboard` | Redirected to the user dashboard |
| 17 | Token guard | Open `/user/reservations` while logged out | Redirected to login |
| 18 | Admin block | Block a pharmacy | It disappears from customer search results |
| 19 | Nearby | Change the radius on the pharmacies page | The pharmacy list changes with distances |
| 20 | Responsive | Open on a phone-width screen | Navigation collapses into a Menu button |

---

## 9. Short project explanation for the viva

**What the project does.** People waste time calling or visiting pharmacies to find out whether a medicine is in stock. This system puts that information online. A customer searches a medicine name, sees every registered pharmacy that stocks it with live quantity and price, and can reserve units for pickup. Pharmacies keep their inventory updated, and the admin oversees the platform.

**Why MERN.** One language (JavaScript) across the stack, MongoDB's document model fits medicine and inventory records that vary in fields, React makes the search interface update without page reloads, and Express keeps the API layer minimal.

**How authentication works.** Passwords are hashed with bcrypt in a Mongoose `pre('save')` hook, so plain passwords are never stored. On login the server signs a JWT containing the user id and role. React stores the token and sends it in the `Authorization` header on every request. The `protect` middleware verifies the signature and loads the user; `authorize('pharmacy')` then checks the role. This is **stateless** authentication — the server keeps no session.

**How role-based access works.** One `users` collection with a `role` field. The backend enforces roles with middleware; the frontend uses `ProtectedRoute` plus role-specific navigation. Frontend checks are for convenience only — the real enforcement is on the server.

**How the search works.** Three levels:
1. Regex match, case-insensitive, on name, brand name and generic name, so `para`, `Dolo` and `Acetaminophen` all find Paracetamol.
2. If nothing matches, a Levenshtein edit-distance pass finds the closest names, so `paracetmol` still returns Paracetamol. The allowed distance scales with word length (1 typo for short words, up to 3 for long ones).
3. Each result is enriched with an aggregation over the inventory collection giving pharmacy count, lowest price, highest price and total units.

**How "nearby pharmacies" works.** Each pharmacy stores a GeoJSON `Point` with a `2dsphere` index. The API uses MongoDB's `$geoNear` aggregation stage to return pharmacies within a radius, sorted by distance. The browser's Geolocation API supplies the customer's coordinates; central Chennai is the fallback.

**Why availability is a separate collection.** A medicine is one real-world product, but every pharmacy has its own price and stock. Keeping the catalogue (`medicines`) separate from stock (`inventory`) avoids duplicating medicine details in every shop's record, and makes price comparison a single query.

**How reservations protect stock.** When a reservation is created the quantity is subtracted from the inventory immediately, so two customers cannot reserve the same last strip. Cancelling or rejecting adds it back. The status flow is pending → confirmed → ready → completed, with cancelled and rejected as terminal states.

**Limitations and future scope.** No online payment, no prescription upload verification, distance is straight-line rather than road distance, and notifications are in-app only. Future work: SMS/email alerts, prescription image upload, a map view with routes, and pharmacy ratings.

---

## 10. Modules summary

**User module:** registration, login, medicine search, medicine details, availability check, nearby pharmacies, price and stock view, reservation, reservation status, notifications, profile management.

**Pharmacy module:** registration, login, shop profile, add medicine, update details, update stock, update price, inventory view, low-stock alerts, reservation management.

**Admin module:** login, dashboard, manage users, manage pharmacies, manage medicines, manage categories, view reservations, monitor system activity.
