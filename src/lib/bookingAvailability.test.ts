import { describe, expect, it, vi } from "vitest";
import { loadOccupiedSlots, type AvailabilityClient } from "./bookingAvailability";

function clientReturning(result: { data: unknown; error: { message: string } | null }): AvailabilityClient {
  return { rpc: vi.fn(async () => result) };
}

describe("loadOccupiedSlots", () => {
  it("requests only occupied slots for the selected date and simulator", async () => {
    const rows = [{ booking_time: "10:00", booking_end_time: "11:00", duration: 60 }];
    const client = clientReturning({ data: rows, error: null });

    await expect(loadOccupiedSlots(client, "2026-09-08", "Bay 1")).resolves.toEqual({
      data: rows,
      error: false
    });
    expect(client.rpc).toHaveBeenCalledWith("get_simulator_occupied_slots", {
      p_booking_date: "2026-09-08",
      p_simulator: "Bay 1"
    });
  });

  it("returns no booking data when the RPC reports an error", async () => {
    const client = clientReturning({ data: [{ full_name: "must not escape" }], error: { message: "denied" } });

    await expect(loadOccupiedSlots(client, "2026-09-08", "Bay 1")).resolves.toEqual({
      data: [],
      error: true
    });
  });

  it("catches a rejected RPC and fails closed", async () => {
    const client: AvailabilityClient = {
      rpc: vi.fn(async () => { throw new Error("network failed"); })
    };

    await expect(loadOccupiedSlots(client, "2026-09-08", "Bay 1")).resolves.toEqual({
      data: [],
      error: true
    });
  });
});
