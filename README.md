# Stingray City Charters bookings

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
