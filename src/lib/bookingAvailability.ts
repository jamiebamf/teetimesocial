export type OccupiedSlot = {
  booking_time: string;
  booking_end_time: string | null;
  duration: number;
};

type AvailabilityError = { message: string };

export type AvailabilityClient = {
  rpc: (
    name: "get_simulator_occupied_slots",
    params: { p_booking_date: string; p_simulator: string }
  ) => Promise<{ data: unknown; error: AvailabilityError | null }>;
};

export async function loadOccupiedSlots(
  client: AvailabilityClient,
  bookingDate: string,
  simulator: string
): Promise<{ data: OccupiedSlot[]; error: boolean }> {
  try {
    const { data, error } = await client.rpc("get_simulator_occupied_slots", {
      p_booking_date: bookingDate,
      p_simulator: simulator
    });

    if (error || !Array.isArray(data)) {
      return { data: [], error: true };
    }

    const slots = data.flatMap((row): OccupiedSlot[] => {
      if (!row || typeof row !== "object") return [];
      const value = row as Record<string, unknown>;
      const bookingTime = value.booking_time;
      const bookingEndTime = value.booking_end_time;
      const duration = value.duration;
      if (typeof bookingTime !== "string" || typeof duration !== "number") {
        return [];
      }
      const normalizedEndTime = typeof bookingEndTime === "string" ? bookingEndTime : null;
      if (bookingEndTime !== null && normalizedEndTime === null) {
        return [];
      }
      return [{
        booking_time: bookingTime,
        booking_end_time: normalizedEndTime,
        duration
      }];
    });

    return { data: slots, error: false };
  } catch {
    return { data: [], error: true };
  }
}
