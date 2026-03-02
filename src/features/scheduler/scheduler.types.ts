export type ScheduledJob = {
	id: string;
	window: string;
};

export type SchedulingWindow = {
	type: string;
	offset: number;
};

export type SchedulingInput = {
	id: string;
	startDate: Date;
};
