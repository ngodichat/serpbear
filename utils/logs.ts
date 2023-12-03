interface Colors {
  reset: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
}
export const COLORS: Colors = {
  reset: "\x1b[0m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};
export const logWithColor = (message: any, color: string) => {
  logWithTime(`${color}${message}${COLORS.reset}`);
}

export const logWithTime = (message: any) => {
  const currentTime = new Date();
  const formattedTime = currentTime.toLocaleString();
  console.log(`[${formattedTime}] ${message}`);
}