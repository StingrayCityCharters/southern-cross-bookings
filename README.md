# Southern Cross Bookings

Web app for **owners** and **hotel concierges**. Each booking is a **private charter** of the whole boat. Concierges and owners both see a month calendar of open, pending, and booked times.

## Run it

In this folder:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

On the same Wi-Fi, concierges can use `http://YOUR-COMPUTER-IP:3000` from a phone.

## First-run access codes

- Concierge: `1357`
- Owner: `2468`

Change these later in `data/db.json` after the first run (that file is created automatically).

## How it works

1. A concierge signs in with their name, hotel, and the concierge code.
2. The calendar shows morning and afternoon charters at a glance: green is open, amber is a pending hold, gray is booked.
3. The concierge taps an open time and pencils in a private hold for one guest party.
4. The owner sees the same calendar, then approves or declines.
5. A pending or confirmed hold takes the whole boat for that date and time.

## Host on GoDaddy

Connect the GitHub repo to **GoDaddy Node.js Hosting**. They will install production packages, run `npm run build`, then `npm start`.

On GoDaddy, reservations and account PINs are stored in the included **MySQL** database so they survive app updates. This computer still uses `data/db.json` for local testing. After you publish this version once, later publishes should keep live bookings and PINs.

If the live site starts empty after the first MySQL publish, open the app’s MySQL / environment settings in GoDaddy and confirm `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` are set for the published app.
