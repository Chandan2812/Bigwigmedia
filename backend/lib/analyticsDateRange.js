const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const RANGE_DAYS = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const toDateString = (date) => date.toISOString().slice(0, 10);

const getDaysAgoRange = (days) => {
  const end = new Date();
  const start = new Date();

  start.setDate(end.getDate() - days);

  return {
    startDate: toDateString(start),
    endDate: toDateString(end),
  };
};

const getDateRange = (query = {}) => {
  const startDate = String(query.startDate || "").trim();
  const endDate = String(query.endDate || "").trim();
  const range = String(query.range || "").trim().toLowerCase();

  if (DATE_PATTERN.test(startDate) && DATE_PATTERN.test(endDate)) {
    return {
      startDate,
      endDate,
    };
  }

  return getDaysAgoRange(RANGE_DAYS[range] || RANGE_DAYS["30d"]);
};

const getMongoDateRange = (dateRange) => {
  const end = new Date();
  const start = new Date();

  if (
    DATE_PATTERN.test(dateRange.startDate) &&
    DATE_PATTERN.test(dateRange.endDate)
  ) {
    const customStart = new Date(`${dateRange.startDate}T00:00:00.000Z`);
    const customEnd = new Date(`${dateRange.endDate}T23:59:59.999Z`);

    if (
      !Number.isNaN(customStart.getTime()) &&
      !Number.isNaN(customEnd.getTime())
    ) {
      return {
        start: customStart,
        end: customEnd,
      };
    }
  }

  start.setDate(end.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

module.exports = {
  getDateRange,
  getMongoDateRange,
};
