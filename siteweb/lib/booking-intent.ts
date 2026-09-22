export const BOOKING_SERVICE_KEY = "macnation.bookingService";
export const BOOKING_RESET_EVENT = "macnation-booking-reset";
export const BOOKING_SERVICE_EVENT = "macnation-booking-service";

let taken: string | undefined;

export function setBookingService(id: string) {
  taken = undefined;
  sessionStorage.setItem(BOOKING_SERVICE_KEY, id);
  window.dispatchEvent(new CustomEvent(BOOKING_SERVICE_EVENT, { detail: id }));
}

export function takeBookingService() {
  if (taken !== undefined) return taken;
  taken = sessionStorage.getItem(BOOKING_SERVICE_KEY) || "";
  sessionStorage.removeItem(BOOKING_SERVICE_KEY);
  return taken;
}

export function clearBookingService() {
  taken = "";
  sessionStorage.removeItem(BOOKING_SERVICE_KEY);
  window.dispatchEvent(new Event(BOOKING_RESET_EVENT));
}
