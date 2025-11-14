const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  static context = "";
  static enabled = process.env.NODE_ENV === "development";
  static level = "info"; // 'debug' | 'info' | 'warn' | 'error'

  static setContext(context) {
    this.context = context;
  }

  static setLevel(level) {
    this.level = level;
  }

  static formatMessage(level, message, data) {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const contextStr = this.context ? `[${this.context}]` : "";
    return `${timestamp}${contextStr} [${level}] ${message}${data ? ":" : ""}`;
  }

  static debug(message, data) {
    if (!this.enabled || this.level !== "debug") return;
    data
      ? console.debug(this.formatMessage("DEBUG", message), data)
      : console.debug(this.formatMessage("DEBUG", message));
  }

  static info(message, data) {
    if (!this.enabled || ["warn", "error"].includes(this.level)) return;
    data
      ? console.info(this.formatMessage("INFO", message), data)
      : console.info(this.formatMessage("INFO", message));
  }

  static warn(message, data) {
    if (!this.enabled || this.level === "error") return;
    data
      ? console.warn(this.formatMessage("WARN", message), data)
      : console.warn(this.formatMessage("WARN", message));
  }

  static error(message, error) {
    if (!this.enabled) return;
    console.error(this.formatMessage("ERROR", message), error);
  }
}

export default Logger;
