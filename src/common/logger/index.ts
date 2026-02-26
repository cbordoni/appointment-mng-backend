type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
	[key: string]: unknown;
}

const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",

	// Foreground colors
	black: "\x1b[30m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",
	gray: "\x1b[90m",
} as const;

class Logger {
	private colorize(text: string, color: keyof typeof colors): string {
		return `${colors[color]}${text}${colors.reset}`;
	}

	private getLevelColor(level: LogLevel): keyof typeof colors {
		switch (level) {
			case "info":
				return "cyan";
			case "warn":
				return "yellow";
			case "error":
				return "red";
			case "debug":
				return "magenta";
		}
	}

	private formatMessage(
		level: LogLevel,
		message: string,
		context?: LogContext,
	): string {
		const timestamp = new Date().toISOString();
		const coloredTimestamp = this.colorize(timestamp, "gray");
		const coloredLevel = this.colorize(
			level.toUpperCase(),
			this.getLevelColor(level),
		);
		const contextStr = context
			? ` ${this.colorize(JSON.stringify(context), "dim")}`
			: "";
		return `${coloredTimestamp} ${coloredLevel} ${message}${contextStr}`;
	}

	info(message: string, context?: LogContext): void {
		console.log(this.formatMessage("info", message, context));
	}

	warn(message: string, context?: LogContext): void {
		console.warn(this.formatMessage("warn", message, context));
	}

	error(message: string, context?: LogContext): void {
		console.error(this.formatMessage("error", message, context));
	}

	debug(message: string, context?: LogContext): void {
		if (Bun.env.NODE_ENV !== "production") {
			console.debug(this.formatMessage("debug", message, context));
		}
	}
}

export const logger = new Logger();
