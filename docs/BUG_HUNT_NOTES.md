# Bug Hunt – Master Notes (Organizer Only)

**Do not share this file with participants.** Participants find bugs only by using the app in the browser (no code access).

This document lists **30 intentional bugs** (10 Easy, 10 Medium, 10 Hard) for the bug hunt game. Each entry includes **how to find it**, **why it matters**, **what participants learn**, and **how to fix it** so the exercise is educational.

---

## How to Run for Participants

- Run the app via Docker: `docker compose up --build` (see README).
- Give participants: **App URL** (e.g. http://localhost:5173), and optionally **API docs** (http://localhost:8000/docs) if you want them to try API calls.
- Default login: **admin@shop.com** / **admin123** (after seed).

---

## Bug List (with educational details)

### BUG 1 — Cart total shows long decimal  
**Difficulty:** Easy | **Category:** Cart / UI  

**How to find:** Add items to cart so total is e.g. 29.99 or 12.50. Open Cart page. Look at the total line.  
**What to see:** Total displayed as `29.990000000000002` or similar.

**Why it matters:** Floating-point numbers in computers cannot represent some decimals exactly (e.g. 0.1 + 0.2 ≠ 0.3 in binary). Displaying raw values looks unprofessional and reduces trust.

**What you learn:** Never display money (or any float) without formatting. Use a fixed number of decimal places; for money, prefer storing in smallest unit (e.g. cents) and converting for display.

**How to fix:**  
- Frontend: Always display totals with `total.toFixed(2)` or a formatter (e.g. `Intl.NumberFormat`).  
- Backend: Round before sending, or store/calculate in integer cents.

**Best practice:** Format all currency for display; never echo `price` or `total` directly in UI.

---

### BUG 2 — Product page allows quantity zero  
**Difficulty:** Easy | **Category:** Products  

**How to find:** Open any product. Set quantity to 0. Click "Add to cart".  
**What to see:** Item added with quantity 0 or cart accepts it.

**Why it matters:** Zero quantity is invalid for an order line. It can cause wrong totals, confusing cart state, or backend errors.

**What you learn:** Validate user input at the boundary: both UI (min/max, disable button) and API (reject invalid quantities).

**How to fix:**  
- Frontend: Clamp quantity to `Math.max(1, Math.min(stock, value))`; disable "Add to cart" when quantity &lt; 1 or &gt; stock.  
- Backend: In order creation, validate each item with `quantity >= 1` and return 400 if not.

**Best practice:** Define valid ranges (min/max) and enforce them in UI and API.

---

### BUG 3 — Product page allows quantity above stock  
**Difficulty:** Easy | **Category:** Products  

**How to find:** Open a product with e.g. "Stock: 5". Set quantity to 10. Add to cart.  
**What to see:** Cart shows 10; no warning.

**Why it matters:** Users can add more than available; order may fail at checkout or cause oversell. UX is poor if we allow invalid input and fail later.

**What you learn:** Constrain input to valid domain (here: 1 to stock). Frontend prevents mistakes; backend must still enforce (clients can be bypassed).

**How to fix:**  
- Frontend: Set input `max={product.stock}` and clamp in `onChange`. Disable "Add to cart" when `qty > product.stock`.  
- Backend: When creating order, check `product.stock >= quantity` and return 400 with a clear message if not.

**Best practice:** Never trust the client; always validate business rules (e.g. stock) on the server.

---

### BUG 4 — No loading state on product list  
**Difficulty:** Easy | **Category:** UI  

**How to find:** Go to Products (or refresh). Watch the list area for about a second.  
**What to see:** A blank area with no spinner or "Loading..." — the list appears after a short empty state.

**Why it matters:** Users cannot tell if the app is loading or broken. Perceived performance and trust suffer.

**What you learn:** Every async operation that takes more than ~200ms should show a loading state (spinner, skeleton, or message). Replace it with content or an error when done.

**How to fix:**  
- While `loading === true`, render a spinner (e.g. `<CircularProgress />`) or skeleton where the list will appear.  
- Set `loading` to false when the fetch completes (success or error).

**Best practice:** Design loading and error states for every data-dependent view.

---

### BUG 5 — No loading state on order detail  
**Difficulty:** Easy | **Category:** UI  

**How to find:** Go to My orders, click an order (or open `/orders/1`). Watch the page for about a second.  
**What to see:** Blank page briefly with no spinner or "Loading..." — then the order content appears.

**Why it matters:** Same as BUG 4: users need feedback during fetch. Empty screen suggests a bug or crash.

**What you learn:** Apply loading states consistently across list and detail pages.

**How to fix:** Show a centered spinner or skeleton while `loading` is true; then show order content or "Order not found".

**Best practice:** Consistent loading patterns across the app improve UX.

---

### BUG 6 — Place order enabled with no address selected  
**Difficulty:** Easy | **Category:** Cart  

**How to find:** Add items to cart, go to Cart. Ensure you have at least one saved address (add one from Addresses if needed). Do **not** select any address in the "Delivery address" radio group.  
**What to see:** "Place order (COD)" is still enabled even though no address is selected. (The app does not auto-select the first address, so the bug is visible.)

**Why it matters:** Order could be placed with a fallback address the user did not choose. User may not realize which address was used.

**What you learn:** Disable primary actions until required data is present; optionally show a short message ("Select delivery address").

**How to fix:**  
- Disable the button when `!selectedAddressId` (and when `addresses.length === 0`).  
- Require `address_id` on the backend and return 400 if missing or invalid.

**Best practice:** Disable submit until form/selection is valid; validate again on the server.

---

### BUG 7 — Empty cart still shows Place order  
**Difficulty:** Easy | **Category:** Cart  

**How to find:** Remove all items (or open Cart with no items).  
**What to see:** Place order button and total still visible.

**Why it matters:** Confusing and unprofessional. User might try to place an empty order.

**What you learn:** Empty states should hide or replace the normal flow (e.g. show "Your cart is empty" and a CTA to shop; hide table and place-order section).

**How to fix:** When `cart.length === 0`, render only the empty-state message and "Browse products"; do not render the cart table, total, or Place order button.

**Best practice:** Design explicit empty states for lists and flows (cart, orders, addresses).

---

### BUG 8 — Header shows "User" after page refresh  
**Difficulty:** Easy | **Category:** Auth / UI  

**How to find:** Log in. Refresh the page (F5).  
**What to see:** Header shows "User" instead of username/email.

**Why it matters:** Token may still be valid but user object (name/email) was not restored, so the UI shows a generic label. Session feels broken.

**What you learn:** Persist not only the token but also minimal user info (e.g. from login/me response) and restore it on app load so the UI stays consistent.

**How to fix:** On load, if a token exists, either decode the JWT (if it contains name/email) or call a "me" endpoint and store the user in state/localStorage. Use that for the header label.

**Best practice:** Restore full session state (token + user profile) on reload so the UI matches the actual session.

---

### BUG 9 — Sign up: password visible in plain text  
**Difficulty:** Medium | **Category:** Auth / Security  

**How to find:** Open Sign up. Type in the password field.  
**What to see:** The password is shown in plain text (characters visible as you type, like a normal text field).

**Why it matters:** Passwords should be masked to prevent shoulder surfing and exposure in screen sharing or recordings.

**What you learn:** Use `type="password"` for password inputs so the value is masked. Never expose passwords in the UI.

**How to fix:** Change the password field to `type="password"` so the input is masked.

**Best practice:** Always use `type="password"` for password fields; consider a "Show password" toggle if needed.

---

### BUG 10 — Login and Sign up links swapped  
**Difficulty:** Easy | **Category:** UI  

**How to find:** On Login page click the link; on Sign up page click the link.  
**What to see:** Labels say "Login" / "Sign up" but point to the opposite page.

**Why it matters:** Navigation is wrong; users go to the wrong screen and get confused.

**What you learn:** Labels and targets must match. Simple copy/link mistakes can break flows.

**How to fix:** On Login page: link to `/signup` with text "Sign up". On Sign up page: link to `/login` with text "Login". Review all auth links.

**Best practice:** Test every link and button for correct target and label.

---

### BUG 11 — Search bar ignores search term  
**Difficulty:** Medium | **Category:** Products  

**How to find:** Type e.g. "mouse" in the top search bar. Submit.  
**What to see:** URL may change but product list does not filter.

**Why it matters:** Frontend and backend must agree on query parameter names. Wrong key (e.g. `q` vs `search`) means the server ignores the filter.

**What you learn:** Contract between client and API: parameter names, types, and semantics must match. Document and test them.

**How to fix:** Use the same parameter name on both sides (e.g. `search`). Frontend: `?search=${encodeURIComponent(term)}`. Backend: read `search` from query and filter products by name/category.

**Best practice:** Define API contract (OpenAPI/Swagger) and use it in the client.

---

### BUG 12 — Product list shows wrong currency symbol  
**Difficulty:** Easy | **Category:** UI  

**How to find:** Open Products. Look at prices.  
**What to see:** "€" (or other symbol) instead of "$".

**Why it matters:** Wrong currency confuses users and can have legal/compliance implications.

**What you learn:** Currency and locale are configuration; centralize them (e.g. constant or i18n) so one change updates the whole app.

**How to fix:** Use a single constant or locale setting for currency (e.g. `CURRENCY_SYMBOL = '$'` or `Intl.NumberFormat` with locale) and use it everywhere prices are shown.

**Best practice:** Don’t hardcode symbols in multiple places; use config or i18n.

---

### BUG 13 — Cart minus button leaves quantity at zero  
**Difficulty:** Medium | **Category:** Cart  

**How to find:** Add one item. In Cart, click "-" until quantity would go below 1.  
**What to see:** Quantity shows 0; row stays.

**Why it matters:** Cart should either remove the line when quantity reaches 0 or prevent going below 1. Zero-quantity lines are invalid and confuse totals.

**What you learn:** Define clear rules for edge cases (e.g. "at 1, minus removes the line"). Implement consistently in state and UI.

**How to fix:** In the minus handler: if current quantity is 1, remove the item from the cart array (splice/filter) instead of setting 0. Update state and localStorage.

**Best practice:** Handle boundary values explicitly (0, 1, max) in business logic.

---

### BUG 14 — Deleting a cart item removes the wrong row  
**Difficulty:** Medium | **Category:** Cart  

**How to find:** Add two different products. Click Delete on the first row.  
**What to see:** The other product disappears.

**Why it matters:** Using array index as React key (or wrong index in delete handler) causes wrong item to be removed when list order or length changes.

**What you learn:** Use a stable, unique key per item (e.g. `product_id` or `product_id + index` if duplicates allowed). Pass the correct identifier to the delete handler (e.g. index or id), and remove by that.

**How to fix:** Use `key={item.product_id}` (or a unique id) for list items. In `removeItem`, filter by the same identifier (e.g. `product_id` or the correct index). Ensure the clicked row’s identifier is passed to `removeItem`.

**Best practice:** Keys must be unique and stable; delete/update by id, not by position.

---

### BUG 15 — View another user's order (IDOR)  
**Difficulty:** Medium | **Category:** Security / Orders  

**How to find:** User A places order (e.g. #1). Log in as User B. Open `/orders/1`.  
**What to see:** User B sees Order #1’s details.

**Why it matters:** **Insecure Direct Object Reference (IDOR).** Attacker can enumerate and access other users’ data. Violates confidentiality and privacy.

**What you learn:** Every resource that belongs to a user must be authorized: check that `resource.user_id === current_user.id` (or equivalent) before returning it. Return 404 or 403 if not.

**How to fix:** In the order detail endpoint, after loading the order, check `order.user_id == current_user.id`. If not, return 403 (or 404 to avoid leaking existence). Never return another user’s order.

**Best practice:** Always enforce ownership or role-based access on every resource access (OWASP: Broken Access Control).

---

### BUG 16 — Auth token sent in URL  
**Difficulty:** Medium | **Category:** Security  

**How to find:** Log in. In DevTools → Network, inspect a GET request (e.g. Products).  
**What to see:** URL contains `?token=...`.

**Why it matters:** URLs are logged (server, proxy, browser history), sent in Referer, and cached. Tokens in URLs can be stolen and violate OWASP guidance.

**What you learn:** Send credentials only in headers (e.g. `Authorization: Bearer <token>`). Never put tokens in query or path.

**How to fix:** Remove any code that appends the token to the request URL. Use only the `Authorization` header for API requests. If you need to pass token for a redirect, use a short-lived one-time code, not the session token.

**Best practice:** Tokens and passwords only in request body or headers; never in URL.

---

### BUG 17 — No error message when order placement fails  
**Difficulty:** Medium | **Category:** Cart / UX  

**How to find:** Cause order to fail (e.g. invalid session or network error). Click Place order.  
**What to see:** Nothing happens or button spins; no error message.

**Why it matters:** Users don’t know the order failed; they may assume it succeeded and never retry or contact support.

**What you learn:** Every failing operation should give clear feedback: message (toast/alert/inline) and optionally retry or next step.

**How to fix:** In the place-order `catch` block, set an error state and display it (e.g. `<Alert severity="error">{error}</Alert>`). Show server message when available (e.g. "Insufficient stock", "Session expired"). For 401, redirect to login.

**Best practice:** Handle errors in UI; show user-friendly messages and actions.

---

### BUG 18 — Price filter works backwards  
**Difficulty:** Hard | **Category:** Products  

**How to find:** Go to **Products**. Use the **"Max price"** dropdown (e.g. select "Under 20").  
**What to see:** The list shows products *above* that price instead of below. "Under 20" returns expensive items; "Under 100" may return cheaper ones. The filter logic is reversed (backend uses `>=` instead of `<=`).

**Why it matters:** Wrong operator inverts filter logic. Users expect "max price 20" to mean "price ≤ 20".

**What you learn:** Compare filter logic to specification; test boundary values. Use `<=` for "max price" and `>=` for "min price".

**How to fix:** In the products list endpoint, use `query.filter(Product.price <= max_price)` for max_price. Add tests: e.g. max_price=10 returns only products with price ≤ 10.

**Best practice:** Unit/integration tests for filters and boundaries; code review for correct operators.

---

### BUG 19 — Signup accepts duplicate email  
**Difficulty:** Medium | **Category:** Auth  

**How to find:** Sign up with email A. Log out. Sign up again with same email A (different username).  
**What to see:** Second signup succeeds.

**Why it matters:** Duplicate emails break "forgot password" and login; can allow account takeover if one account is compromised.

**What you learn:** Enforce uniqueness on unique fields (email, username) at the database and application layer. Return a clear 400 when duplicate.

**How to fix:** Before creating a user, query for existing user with same email. If found, return 400 with message "Email already registered". Use a unique index on the email column so the DB also enforces it.

**Best practice:** Unique constraints in DB + explicit check in code; consistent error messages.

---

### BUG 20 — Signup accepts duplicate username  
**Difficulty:** Medium | **Category:** Auth  

**How to find:** Sign up with username "john". Log out. Sign up again with "john" (different email).  
**What to see:** Second signup succeeds.

**Why it matters:** Same as BUG 19 for usernames: confusion, impersonation risk, and broken assumptions (e.g. @username).

**What you learn:** Treat username like email: unique in DB and checked on signup.

**How to fix:** Before creating user, check for existing user with same username. If found, return 400 "Username already taken". Add unique index on username.

**Best practice:** Document and enforce uniqueness for all identifier fields.

---

### BUG 21 — Address form accepts invalid pincode  
**Difficulty:** Medium | **Category:** Addresses  

**How to find:** Add address with pincode "12345" (5 digits) or "1234567" (7 digits).  
**What to see:** Form submits and saves.

**Why it matters:** Invalid pincodes cause failed delivery or wrong logistics. Validation should match business rules (e.g. 6 digits for Indian pincode).

**What you learn:** Validate format and length on both client (UX) and server (security). Use regex or a validator library; return clear errors.

**How to fix:** Frontend: validate with e.g. `/^\d{6}$/` and show error. Backend: in schema use `Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")` and return 422 with field-level errors.

**Best practice:** Same validation rules and messages on client and server.

---

### BUG 22 — Address line runs script (XSS)  
**Difficulty:** Hard | **Category:** Security  

**How to find:** Go to **Addresses**. Add a new address and in **Address line 1** (or line 2) enter: `<script>alert('XSS')</script>`. Save. View the addresses list.  
**What to see:** An alert runs (script executed) when the address is displayed, because the app renders the address line as HTML.

**Why it matters:** **Cross-Site Scripting (XSS).** User-controlled data (address) is rendered as HTML without sanitization. An attacker could steal tokens, redirect, or modify the page. OWASP Top 10.

**What you learn:** Never render user-controlled content as HTML without sanitization. Prefer plain text; if HTML is required, use a sanitizer with allowlist (e.g. DOMPurify) and never allow `script` or event handlers.

**How to fix:** Do not use `dangerouslySetInnerHTML` for address line1/line2. Render as plain text (e.g. `{a.line1}`). React escapes by default when you use `{a.line1}`. If you must allow limited HTML, sanitize with a library (e.g. DOMPurify) with a strict allowlist.

**Best practice:** Default to text for user input; if HTML is needed, sanitize and limit tags/attributes (Content Security Policy can help).

---

### BUG 23 — JWT access token expires only after a very long time  
**Difficulty:** Hard | **Category:** Auth / Security  

**How to find:** Log in. Open DevTools → Application (or Network), find the token (e.g. in localStorage as `authToken` or in a request header). Decode the JWT (e.g. at jwt.io or via atob on the payload). Check the `exp` (expiry) claim.  
**What to see:** The token expires only after many hours (e.g. 24 hours). For better security, access tokens are often short-lived (e.g. 15 minutes) with refresh tokens for renewal.

**Why it matters:** Long-lived access tokens increase the window of abuse if the token is stolen. Short-lived tokens limit exposure.

**What you learn:** Use short-lived access tokens (e.g. 15–60 min) and refresh tokens for session extension. Optionally implement server-side invalidation on logout.

**How to fix:** Reduce `access_token_expire_minutes` in config (e.g. to 15 or 60). Optionally add a refresh token flow and revoke refresh token on logout.

**Best practice:** Short-lived access tokens; refresh tokens for long sessions; consider token blacklist on logout for high-security apps.

---

### BUG 24 — Expected delivery date is wrong  
**Difficulty:** Hard | **Category:** Orders  

**How to find:** Place an order. Open order detail. Check "Expected delivery".  
**What to see:** Date in the past or obviously wrong.

**Why it matters:** Wrong dates mislead customers and support. Business logic (e.g. +N days from order, timezone) must be correct and consistent.

**What you learn:** Date/time logic (timezone, DST, "business days") is error-prone. Use a library (e.g. date-fns, moment) and document the rule (e.g. "7 calendar days from order in UTC").

**How to fix:** In backend, compute delivery as e.g. `datetime.utcnow() + timedelta(days=7)` (or business-day logic). Store in UTC; frontend displays with user timezone if needed. Add tests for the calculation.

**Best practice:** Centralize date logic; use UTC in backend; test with fixed dates.

---

### BUG 25 — List all users without proper access control  
**Difficulty:** Hard | **Category:** Security  

**How to find:** In the **top navigation**, click **"Users"** (or open `/users` in the address bar). You can do this without logging in, or while logged in as any user.  
**What to see:** A list of all registered users (e.g. emails, usernames) is displayed. The page calls GET /auth/users, which does not require authentication or admin role.

**Why it matters:** **Broken Access Control.** Sensitive user data (emails, names) is exposed. Should require at least login and ideally admin role.

**What you learn:** Every endpoint that returns sensitive data must require authentication (and often authorization, e.g. admin). Apply `Depends(get_current_user)` and for list-all, `Depends(get_current_admin)`.

**How to fix:** Protect GET /auth/users: add `Depends(get_current_admin)` (or remove the endpoint). Return 401/403 when not allowed.

**Best practice:** Default to "deny"; explicitly allow access per role/resource (OWASP: Broken Access Control).

---

### BUG 26 — Any user can change any order's status  
**Difficulty:** Hard | **Category:** Security  

**How to find:** User A places an order (e.g. Order #1). Log in as **User B**. Open **My orders** (you will see User A's orders too — BUG 27). Click Order #1 to open the **order detail** page. Use the **"Update status"** dropdown and change the status (e.g. to Shipped or Cancelled).  
**What to see:** A’s order status changes.

**Why it matters:** Attacker can cancel or alter others’ orders. Again, missing ownership/authorization check.

**What you learn:** Mutations (update/delete) must verify the resource belongs to the current user (or that the user has the right role, e.g. admin).

**How to fix:** In the status-update endpoint, load the order and check `order.user_id == current_user.id` (or allow only admin). If not, return 403. Optionally restrict which statuses a user can set (e.g. only admin can set "shipped").

**Best practice:** Every mutation: load resource, check ownership/role, then update.

---

### BUG 27 — Orders list shows other users' orders  
**Difficulty:** Hard | **Category:** Security  

**How to find:** User A places orders. User B logs in and opens My orders.  
**What to see:** B sees A’s orders in the list.

**Why it matters:** List endpoint returns data for all users instead of filtering by current user. Massive data leak and privacy violation.

**What you learn:** List/query endpoints must always filter by the current user (or by permitted scope). Never return "all" unless the caller is explicitly authorized (e.g. admin).

**How to fix:** In the list-orders endpoint, add `.filter(Order.user_id == current_user.id)` (or equivalent). Remove any logic that returns all orders without this filter.

**Best practice:** Apply tenant/user filter in every list query; test with multiple users.

---

### BUG 28 — Stock can go negative  
**Difficulty:** Hard | **Category:** Orders / Backend  

**How to find:** Product has stock 2. Two users (or tabs) add 2 each and place order.  
**What to see:** Both orders succeed; stock becomes negative (or second order should fail but doesn’t).

**Why it matters:** Overselling hurts inventory and customers. Concurrency causes race: both read "stock=2", both decrement.

**What you learn:** Stock decrement must be atomic and conditional. Use a single DB operation like `UPDATE product SET stock = stock - ? WHERE id = ? AND stock >= ?` and check affected rows; if 0, reject the order.

**How to fix:** In a transaction: (1) Lock or update the product row with a conditional: `stock = stock - qty WHERE id = ? AND stock >= qty`. (2) If no row updated, rollback and return 400 "Insufficient stock". (3) Then create the order. Never read-then-write for stock.

**Best practice:** Use atomic updates and optimistic/pessimistic locking for shared counters (inventory, balance).

---

### BUG 29 — Delete address deletes another user's address  
**Difficulty:** Hard | **Category:** Security  

**How to find:** User A has address id 1. User B calls DELETE /addresses/1 with B’s token.  
**What to see:** A’s address is deleted (or API returns success).

**Why it matters:** **IDOR again.** Delete must verify the resource belongs to the current user.

**What you learn:** Delete (and update) must use the same ownership check as read: filter by both resource id and user id.

**How to fix:** In delete endpoint, load address with `filter(Address.id == id, Address.user_id == current_user.id)`. If not found, return 404. Then delete. Never delete by id alone.

**Best practice:** All mutations: filter by resource id and owner (or role); then act.

---

### BUG 33 — Password visible in browser URL  
**Difficulty:** Hard | **Category:** Security  

**How to find:** Check if any flow puts password in the URL (e.g. GET with password= in query). Check address bar or Network.  
**What to see:** Password in URL or query string.

**Why it matters:** URLs are logged, cached, and sent in Referer. Passwords must never appear in URL (OWASP, CWE).

**What you learn:** Use POST for login; send credentials in body. Never use GET for actions that include secrets.

**How to fix:** Ensure login (and any credential submission) uses POST with body (e.g. form or JSON). Remove any GET login or redirect that includes password in query. Use HTTPS so body is encrypted in transit.

**Best practice:** Credentials only in POST body (or headers like Authorization); never in URL.

---

## Additional bugs (extras)

- **BUG 30** — Place order without selecting address (similar to BUG 6): enforce `selectedAddressId` in UI and backend.  
- **BUG 31** — No empty state for search: when results are 0, show "No products found. Try different keywords."  
- **BUG 32** — On the **Order detail page** (when viewing a single order, e.g. `/orders/1`), the **"My orders"** button at the bottom incorrectly navigates to the **Products** page instead of the Orders list. Fix: change the button to `navigate('/orders')`.  
- **BUG 34** — Backend accepts weak password: add server-side validation (min length, complexity) and return 400 with clear message.

---

## Summary Table (10 Easy, 10 Medium, 10 Hard)

| ID  | Difficulty | Category   | One-line description |
|-----|------------|------------|-----------------------|
| 1   | Easy       | Cart       | Cart total long decimal |
| 2   | Easy       | Products   | Quantity 0 allowed on product page |
| 3   | Easy       | Products   | Quantity > stock allowed |
| 4   | Easy       | UI         | No loading on product list |
| 5   | Easy       | UI         | No loading on order detail |
| 6   | Easy       | Cart       | Place order enabled with no address |
| 7   | Easy       | Cart       | Empty cart still shows Place order |
| 8   | Easy       | Auth       | Header shows "User" after refresh |
| 10  | Easy       | UI         | Login/Signup links swapped |
| 12  | Easy       | UI         | Wrong currency symbol |
| 9   | Medium     | Auth       | Password visible on signup (plain text) |
| 11  | Medium     | Products   | Search bar ignores term |
| 13  | Medium     | Cart       | Minus leaves quantity 0 |
| 14  | Medium     | Cart       | Delete removes wrong row |
| 15  | Medium     | Security   | View another user's order (IDOR) |
| 16  | Medium     | Security   | Token in URL |
| 17  | Medium     | Cart       | No error on order failure |
| 19  | Medium     | Auth       | Duplicate email accepted |
| 20  | Medium     | Auth       | Duplicate username accepted |
| 21  | Medium     | Addresses  | Invalid pincode accepted |
| 18  | Hard       | Products   | Max price filter reversed (Products page) |
| 22  | Hard       | Security   | XSS in address line (Addresses page) |
| 23  | Hard       | Auth       | JWT token expiry too long (e.g. 24h) |
| 24  | Hard       | Orders     | Wrong expected delivery date |
| 25  | Hard       | Security   | Users page / GET /auth/users without auth |
| 26  | Hard       | Security   | Update status on order detail (any order) |
| 27  | Hard       | Security   | Orders list shows all users' orders |
| 28  | Hard       | Backend    | Stock can go negative |
| 29  | Hard       | Security   | Delete another user's address |
| 33  | Hard       | Security   | Password in URL |

---

**Total: 30 bugs for scoring** — **10 Easy**, **10 Medium**, **10 Hard**

Use the "Why it matters", "What you learn", and "How to fix" sections when debriefing so the bug hunt teaches secure coding, validation, and UX practices.

---

## Quick reference (where to find)

- **BUG 4:** Products page — blank area for ~1s with no spinner when loading.
- **BUG 5:** Order detail page (e.g. `/orders/1`) — blank area for ~1s with no spinner when loading.
- **BUG 6:** Cart page — have addresses but do not select any; "Place order" stays enabled.
- **BUG 18:** Products page — use the "Max price" dropdown; filter is reversed.
- **BUG 22:** Addresses page — add address with `<script>alert('XSS')</script>` in line 1 or 2; view list.
- **BUG 25:** Nav bar — click "Users" (or open `/users`); full user list without auth.
- **BUG 26:** Order detail page — after opening any order (e.g. another user's via IDOR), use "Update status" dropdown.
- **BUG 32:** Order detail page — the "My orders" button at the bottom goes to Products instead of Orders list.
