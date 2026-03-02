import type { Result } from "neverthrow";

import type { SchedulingError } from "./scheduler.service";
import type { SchedulingInput } from "./scheduler.types";

type ScheduleResult = Promise<Result<void, SchedulingError>>;

export interface IScheduler {
	schedule(appointment: SchedulingInput): ScheduleResult;

	reschedule(appointment: SchedulingInput): ScheduleResult;

	clear(jobId: SchedulingInput["id"]): ScheduleResult;
}
