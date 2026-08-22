export type Role = "owner" | "concierge";

export type Trip = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  boats: number;
  active: boolean;
  details: string;
};

export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled";

export type Booking = {
  id: string;
  tripId: string;
  tripName: string;
  date: string;
  guestName: string;
  guestCount: number;
  hotelName: string;
  conciergeName: string;
  phone: string;
  notes: string;
  cancelReason: string;
  cancelledByName: string;
  cancelledByRole: Role | "";
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  role: Role;
  name: string;
  hotelName: string;
  createdAt: string;
};

export type Database = {
  accessCodes: {
    owner: string;
    concierge: string;
  };
  trips: Trip[];
  bookings: Booking[];
  sessions: Session[];
};

export type PublicSession = Omit<Session, "id">;

export type SlotStatus = "available" | "pending" | "booked";

export type SlotAvailability = {
  tripId: string;
  shortLabel: string;
  status: SlotStatus;
  remaining: number;
  boats: number;
};

export type TripAvailability = Trip & {
  shortLabel: string;
  status: SlotStatus;
  remaining: number;
};
